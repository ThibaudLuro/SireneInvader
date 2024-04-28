# Documentation de l'Indexeur

## Description Générale

Cette application indexe des fichiers CSV stockés dans un répertoire spécifiquement nommé `./data`. Elle est conçue pour utiliser Node.js et PM2, facilitant une indexation multi-threadée efficace avec des fonctionnalités avancées telles que la mise en pause et la reprise du processus d'indexation en temps réel.

## Initialisation

### Préparation des fichiers

Avant de démarrer l'indexation, il est impératif de préparer l'environnement :
1. Créer un dossier `data` à la racine du projet.
2. Placer le fichier CSV à indexer, principalement `StockEtablissement_utf8.csv`, dans ce dossier.
3. Lancer le processus de décomposition du fichier CSV pour préparer les données à l'indexation avec la commande suivante :

```bash
node splitCsv.js
```

## Configuration

Le système utilise un fichier `process.json` pour configurer le démarrage avec PM2. Ce fichier spécifie que l'application doit être exécutée en mode `fork` pour permettre l'exécution d'interactions à partir de la ligne de commande.

## Fonctionnement

### Architecture Multithread
L'application tire parti de l'architecture multi-thread pour distribuer le traitement des fichiers CSV entre plusieurs processus (travailleurs). Chaque travailleur est une instance de worker.js, exécutant une partie de la charge de traitement.

### Coordination des Travailleurs
index.js joue le rôle de coordinateur, lançant les travailleurs et gérant les interactions entre eux, notamment la synchronisation des commandes de pause et de reprise.

### Traitement des Fichiers CSV
Chaque travailleur lit et traite des segments de fichiers CSV attribués, parse les données selon le schéma défini dans model.js, et les insère dans MongoDB. Les opérations de lecture et d'écriture sont optimisées pour la performance et la fiabilité.

### Contrôle de Flux
Les travailleurs peuvent être mis en pause et repris, permettant une gestion flexible des ressources système et évitant la perte de progrès en cas d'interruption.

### Fichiers et Dossiers

- `index.js` : Le script principal qui lance les travailleurs et gère les commandes.
- `worker.js` : Script exécuté par chaque travailleur, responsable de l'indexation des fichiers CSV.
- `model.js` : Définit le schéma Mongoose pour les données à indexer.
- `csv.js` : Contient des utilitaires pour parser les lignes CSV. Cela inclut la fonction splitCsvLine qui découpe une ligne CSV en champs.
- `process.json` : Configuration pour PM2.

### Dépendances

- PM2 : Utilisé pour gérer et maintenir les processus de l'application.
- Mongoose : Pour interagir avec MongoDB où les données indexées sont stockées.
- Node.js et NPM : Environnement d'exécution et gestionnaire de paquets.

## Commandes

Les commandes suivantes peuvent être utilisées pour interagir avec l'application :

### Pause

Mettre en pause tous les travailleurs. Cela arrête temporairement l'indexation sans perdre l'état actuel.

Commande : `pause`

### Reprise

Reprendre l'indexation après une pause.

Commande : `resume`

## Utilisation

Pour démarrer l'application, utilisez la commande suivante avec PM2 :

```bash
pm2 start process.json
```