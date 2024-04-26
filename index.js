import pm2 from 'pm2';
import { readdir } from 'fs/promises';
import { open } from 'fs/promises';
import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline';
import CsvUtils from './utils/class/csv.js';

const filesInDirectory = await readdir('./data');
const csvFiles = filesInDirectory.filter(file => /^\d+\.csv$/.test(file));
const nbfiles = csvFiles.length;
const nbthread = 4;

const filehandle = await open('./data/1.csv');
const buf = await filehandle.readFile();
filehandle.close();

const fields = CsvUtils.splitCsvLine(buf);
const needed = ['siren', 'nic', 'siret', 'dateCreationEtablissement', 'dateDernierTraitementEtablissement', 'typeVoieEtablissement', 'libelleVoieEtablissement', 'codePostalEtablissement', 'libelleCommuneEtablissement', 'codeCommuneEtablissement', 'dateDebut', 'etatAdministratifEtablissement'];
const indexes = needed.map((key) => fields.indexOf(key));

pm2.connect((err) => {
    if (err) {
        console.error(err)
        process.exit(2)
    }

    const filesPerThread = Math.floor(nbfiles / nbthread);
    const nbRemaining = nbfiles - nbthread * filesPerThread;

    const fileNames = new Array(nbfiles);
    for (let i = 0; i < nbfiles; i++) {
        fileNames[i] = `./data/${(i + 1).toString()}.csv`;
    }

    for (let i = 0; i < nbthread; i++) {
        const addOneFile = i < nbRemaining;
        const firstFileIndex = i * filesPerThread + (addOneFile ? i : nbRemaining);
        const argFilenames = fileNames.slice(firstFileIndex, firstFileIndex + filesPerThread + addOneFile);
        const args = [JSON.stringify(argFilenames), JSON.stringify(indexes), JSON.stringify(needed)];
        pm2.start({
            name: `worker${i}`,
            script: './worker.js',
            autorestart: false,
            args: args,
        }, (err, apps) => {
            pm2.disconnect();
        });
    }
});
