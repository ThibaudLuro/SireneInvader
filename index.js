import pm2 from 'pm2';
import { readdir } from 'fs/promises';
import { open } from 'fs/promises';
import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline';
import CsvUtils from './utils/class/csv.js';

async function main() {
    const filesInDirectory = await readdir('./data');
    const csvFiles = filesInDirectory.filter(file => /^\d+\.csv$/.test(file));
    const nbfiles = csvFiles.length;
    const nbthread = 4;

    const startTime = Date.now();
    let totalTime = 0;
    let workersDone = 0;

    const filehandle = await open('./data/1.csv');
    const buf = await filehandle.readFile();
    filehandle.close();

    const fields = CsvUtils.splitCsvLine(buf);
    const needed = ['siren', 'nic', 'siret', 'dateCreationEtablissement', 'dateDernierTraitementEtablissement', 'typeVoieEtablissement', 'libelleVoieEtablissement', 'codePostalEtablissement', 'libelleCommuneEtablissement', 'codeCommuneEtablissement', 'dateDebut', 'etatAdministratifEtablissement'];
    const indexes = needed.map((key) => fields.indexOf(key));

    pm2.connect((err) => {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        const filesPerThread = Math.floor(nbfiles / nbthread);
        const nbRemaining = nbfiles - nbthread * filesPerThread;

        const fileNames = csvFiles.map((file, index) => `./data/${file}`);
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
                if (err) {
                    console.error(err);
                }
            });
        }
    });

    pm2.launchBus((err, pm2_bus) => {
        pm2_bus.on('process:msg', function (packet) {
            const { process, data } = packet;
            const { cmd, nbInserts, timeMs, filename, reason } = data;
            const { name } = process;

            switch (cmd) {
                case 'fileDone':
                    console.log(`${name}: ${filename} finished in ${timeMs}ms`);
                    break;

                case 'workerDone':
                    workersDone++;

                    if (workersDone == nbthread) {
                        const delta = Date.now() - startTime;
                        totalTime += delta;
                        console.log(`Total in ${totalTime}ms !`);
                        pm2.disconnect();
                    }
                    break;

                case 'error':
                    console.log(`${name} error: ${reason}`);
                    break;

                default:
                    console.log(`${name}: unknown command: ${packet}`);
                    break;
            }
        });
    });

    function sendCommandToWorker(command, id) {
        pm2.sendDataToProcessId({
            id: id,
            type: 'process:msg',
            data: {
                cmd: command,
            },
            topic: true,
        }, () => { });
    }

    function sendCommandToWorkers(command) {
        pm2.list((err, apps) => {
            apps.forEach((app) => sendCommandToWorker(command, app.pm_id));
        });
    }

    function pauseWorkers() {
        sendCommandToWorkers('pause');
    }

    function resumeWorkers() {
        sendCommandToWorkers('resume');
    }
}

main().catch(console.error);