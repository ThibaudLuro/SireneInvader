// import fs from 'fs';
// import mongoose from 'mongoose';
// import Etablissement from './model.js';

// // MongoDB Connection
// mongoose.connect('mongodb://localhost:27017/sirene').then(() => {
//     function parseCsvLine(line) {
//         return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
//     }

//     async function indexFile(file, indexes, neededFields) {
//         const fileContent = fs.readFileSync(file, 'utf8');
//         const lines = fileContent.split('\n');
//         const operations = [];

//         for (let i = 1; i < lines.length; i++) {
//             if (!lines[i]) continue;
//             const data = parseCsvLine(lines[i]);
//             const recordData = {};
//             indexes.forEach((index, idx) => {
//                 recordData[neededFields[idx]] = data[index];
//             });

//             operations.push({
//                 updateOne: {
//                     filter: { siren: recordData.siren },
//                     update: { $set: recordData },
//                     upsert: true 
//                 }
//             });
//         }

//         if (operations.length > 0) {
//             const result = await Etablissement.bulkWrite(operations, { ordered: false });
//             console.log(`${result.nUpserted} records upserted, ${result.nModified} records modified from ${file}`);
//         }
//     }

//     (async () => {
//         const args = process.argv.slice(2);
//         const filenames = JSON.parse(args[0]);
//         const indexes = JSON.parse(args[1]);
//         const neededFields = JSON.parse(args[2]);

//         for (let file of filenames) {
//             await indexFile(file, indexes, neededFields);
//         }
//         mongoose.disconnect();
//     })();

// }).catch(console.error);


import fs from 'fs';
import mongoose from 'mongoose';
import Etablissement from './model.js';

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/sirene').then(() => {
    function parseCsvLine(line) {
        return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
    }

    function parseCsvLine(line) {
        return line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
    }

    function allFieldsFilled(data) {
        return Object.values(data).every(x => x !== '');
    }

    async function indexFile(file, indexes, neededFields) {
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
            console.log(`${result.nInserted} records inserted from ${file}`);
        } else {
            console.log(`No valid records to insert from ${file}`);
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
        mongoose.disconnect();
    })();

}).catch(console.error);
