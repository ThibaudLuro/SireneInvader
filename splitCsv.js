import fs from 'fs'
import readline from 'readline';
import path from 'path';

function splitCSV(inputFile, outputDir, batchSize) {
    const inputStream = fs.createReadStream(inputFile, 'utf8');
    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity
    });

    let lines = [];
    let fileIndex = 1;

    rl.on('line', (line) => {
        lines.push(line);

        if (lines.length >= batchSize) {
            const outputFile = path.join(outputDir, `${fileIndex}.csv`);
            fs.writeFile(outputFile, lines.join('\n'), 'utf8', (err) => {
                if (err) {
                    console.error(`Erreur d'écriture du fichier ${outputFile} :`, err);
                } else {
                    console.log(`Fichier ${outputFile} créé avec succès.`);
                }
            });

            lines = [];
            fileIndex++;
        }
    });

    rl.on('close', () => {
        if (lines.length > 0) {
            const outputFile = path.join(outputDir, `${fileIndex}.csv`);
            fs.writeFile(outputFile, lines.join('\n'), 'utf8', (err) => {
                if (err) {
                    console.error(`Erreur d'écriture du fichier ${outputFile} :`, err);
                } else {
                    console.log(`Fichier ${outputFile} créé avec succès.`);
                }
            });
        }
    });
}

const inputFile = './data/StockEtablissement_utf8.csv';
const outputDir = './data';
const batchSize = 1000000;

splitCSV(inputFile, outputDir, batchSize);
