# Assistant Virtuel WhatsApp avec Gemini AI

Ce projet est un assistant virtuel qui utilise l'API Gemini de Google pour répondre automatiquement aux messages WhatsApp.

## Fonctionnalités

- Connexion à WhatsApp Web via un QR code
- Traitement des messages entrants avec Gemini AI
- Réponses automatiques aux utilisateurs

## Prérequis

- Node.js (v14 ou supérieur)
- Compte WhatsApp actif
- Clé API Gemini (https://makersuite.google.com/app/apikey)

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Installez les dépendances :
   ```
   npm install
   ```
3. Configurez votre fichier `.env` avec votre clé API Gemini :
   ```
   GEMINI_API_KEY=votre_clé_api_ici
   ```

## Utilisation

1. Lancez l'application :
   ```
   node index.js
   ```
2. Scannez le QR code avec WhatsApp sur votre téléphone (Menu WhatsApp > WhatsApp Web)
3. Une fois connecté, l'assistant répondra automatiquement aux messages reçus

## Personnalisation

Vous pouvez personnaliser le comportement de l'assistant en modifiant le fichier `index.js` :

- Pour ignorer les messages de groupes, décommentez la ligne : `if (message.from.endsWith('@g.us')) return;`
- Pour modifier le prompt envoyé à Gemini, ajustez la variable `promptText`

## Notes importantes

- La première connexion nécessite de scanner un QR code
- Les sessions sont conservées localement grâce à LocalAuth
- Vous devez obtenir une clé API Gemini depuis la console Google AI Studio