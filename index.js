const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Configuration du client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Initialisation de l'API Gemini - Correction de la version du modèle
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Fonction pour détecter si un message contient un lien
function containsLink(text) {
    // Regex pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.(com|net|org|fr|io|co|uk|us|ca|ru|eu)([^\s]*|\b))/gi;
    return urlRegex.test(text);
}

// Gestion des taux limites (rate limit)
let requestQueue = [];
let isProcessing = false;
const MIN_DELAY_BETWEEN_REQUESTS = 6000; // 6 secondes de délai entre les requêtes
let lastRequestTime = 0;

// Fonction pour traiter la file d'attente des messages
async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    const currentTime = Date.now();
    const { message, retry = 0 } = requestQueue.shift();
    
    // Vérifier si le message contient un lien
    if (containsLink(message.body)) {
        console.log(`Message ignoré car il contient un lien: ${message.body}`);
        isProcessing = false;
        processQueue(); // Passer au message suivant
        return;
    }
    
    // Ajouter un délai si nécessaire pour respecter le taux limite
    const timeSinceLastRequest = currentTime - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        const delayNeeded = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    try {
        console.log(`Message reçu de ${message.from}: ${message.body}`);
        
        // Obtenir une réponse de Gemini
        const promptText = message.body;
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const responseText = response.text();
        
        // Envoyer la réponse à l'utilisateur
        message.reply(responseText);
        console.log(`Réponse envoyée: ${responseText.substring(0, 50)}...`);
        
        // Mettre à jour le timestamp de la dernière requête
        lastRequestTime = Date.now();
    } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
        
        // Gestion spécifique des erreurs de quota (429)
        if (error.status === 429 && retry < 3) {
            console.log(`Limite de taux atteinte, nouvelle tentative dans 10 secondes (tentative ${retry + 1}/3)...`);
            // Remettre le message dans la file d'attente avec un compteur de tentatives incrémenté
            requestQueue.unshift({ message, retry: retry + 1 });
            // Attendre 10 secondes avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            message.reply('Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer plus tard.');
        }
    }
    
    isProcessing = false;
    processQueue(); // Traiter le message suivant
}

// Affichage du QR code pour se connecter à WhatsApp Web
client.on('qr', (qr) => {
    console.log('QR Code reçu, veuillez le scanner avec WhatsApp sur votre téléphone:');
    qrcode.generate(qr, { small: true });
});

// Événement déclenché lorsque le client est prêt
client.on('ready', () => {
    console.log('Client connecté avec succès!');
    console.log('L\'assistant virtuel WhatsApp est actif et prêt à répondre aux messages.');
});

// Traitement des messages entrants
client.on('message', async (message) => {
    // Ignorer les messages de groupes si vous le souhaitez
    // if (message.from.endsWith('@g.us')) return;
    
    // Ajouter le message à la file d'attente
    requestQueue.push({ message });
    processQueue();
});

// Gestion des erreurs
client.on('disconnected', (reason) => {
    console.log('Client déconnecté:', reason);
    // Vous pouvez ajouter une logique pour se reconnecter ici
});

// Démarrage du client
client.initialize();