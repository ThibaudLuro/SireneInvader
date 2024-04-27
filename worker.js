import fs from 'fs';
import mongoose from 'mongoose';
import Etablissement from './model.js';

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/sirene').then(() => {
    function sendDataToMaster(packet) {
        process.send({
            type: 'process:msg',
            data: packet,
        });
    }

    function parseCsvLine(line) {
        return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
    }

    function allFieldsFilled(data) {
        return Object.values(data).every(x => x !== '');
    }

    async function indexFile(file, indexes, neededFields) {
        const startTime = Date.now();
        const fileContent = fs.readFileSync(file, 'utf8');
        const lines = fileContent.split('\n');
        const operations = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const data = parseCsvLine(lines[i]);
            const recordData = {};
            indexes.forEach((index, idx) => {
                recordData[neededFields[idx]] = data[index];
            });

            if (allFieldsFilled(recordData)) {
                operations.push({
                    insertOne: {
                        document: recordData
                    }
                });
            }
        }

        if (operations.length > 0) {
            const result = await Etablissement.bulkWrite(operations, { ordered: false });
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            sendDataToMaster({cmd: 'fileDone', filename: file, timeMs: totalTime});
        } else {
            sendDataToMaster({cmd: 'error', reason: file});
        }
    }

    (async () => {
        const args = process.argv.slice(2);
        const filenames = JSON.parse(args[0]);
        const indexes = JSON.parse(args[1]);
        const neededFields = JSON.parse(args[2]);

        for (let file of filenames) {
            await indexFile(file, indexes, neededFields);
        }

        sendDataToMaster({cmd: 'workerDone'});
        mongoose.disconnect();
    })();

}).catch(console.error);
