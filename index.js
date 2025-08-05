const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_API;
const app = express();
const bot = new TelegramBot(token);

// Set this to your public deployed domain
const WEBHOOK_URL = 'https://medial-agent.onrender.com'; // ⬅️ CHANGE THIS to your real domain

// Set webhook
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

let latestChatId = null;

// Parse Telegram JSON updates
app.use(express.json());

// Route that Telegram will call with new updates
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body); // Pass update to bot
    res.sendStatus(200);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    latestChatId = chatId;

    const message = `Hello! I am a medical bot. I will assist you. To fill this form <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">click here</a>.`;

    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// Your custom POST endpoint to receive data from other services
app.post('/relay-data', (req, res) => {
    if (!latestChatId) {
        return res.status(400).json({ message: 'No user has interacted with the bot yet.' });
    }

    bot.sendMessage(latestChatId, `Data: ${JSON.stringify(req.body)}`);
    res.status(200).json({ message: 'Sent to Telegram' });
});

// Optional GET route for health check
app.get('/', (req, res) => {
    res.send('Relay AI Bot is running. Telegram is using webhooks.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
