import mongoose from 'mongoose';
const { Schema } = mongoose;

const dataSchema = new Schema({
    siren: String,
    nic: String,
    siret: String,
    dateCreationEtablissement: String,
    dateDernierTraitementEtablissement: String,
    typeVoieEtablissement: String,
    libelleVoieEtablissement: String,
    codePostalEtablissement: String,
    libelleCommuneEtablissement: String,
    codeCommuneEtablissement: String,
    dateDebut: String,
    etatAdministratifEtablissement: String
});

export default mongoose.model('Etablissement', dataSchema);

