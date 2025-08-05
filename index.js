const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const token = process.env.BOT_API;

const bot = new TelegramBot(token);

// Set this to your public Render URL
const WEBHOOK_URL = 'https://medial-agent.onrender.com';

// Set webhook
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// Middleware to parse incoming JSON
app.use(express.json());

// Track last user who messaged the bot
let lastChatId = null;

// Handle incoming webhook events
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Handle /start and any other message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    lastChatId = chatId;

    const welcome = `Hello! I am a medical bot. I will assist you.\nTo fill this form <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">click here</a>.`;
    bot.sendMessage(chatId, welcome, { parse_mode: 'HTML' });
});

// Relay external POST data to the Telegram chat
app.post('/relay-data', async (req, res) => {
    if (!lastChatId) {
        return res.status(400).json({ message: 'No user has interacted with the bot yet.' });
    }

    try {
        // Send loading message
        const loadingMsg = await bot.sendMessage(lastChatId, '⏳ Loading data...');

        // Optionally simulate delay:
        // await new Promise(r => setTimeout(r, 1000));

        // Format data
        const formattedData = `<b>✅ Data Received:</b>\n<pre>${JSON.stringify(req.body, null, 2)}</pre>`;

        // Replace loading with actual data
        await bot.editMessageText(formattedData, {
            chat_id: lastChatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'HTML'
        });

        res.status(200).json({ message: 'Data relayed to Telegram.' });
    } catch (error) {
        console.error('Telegram send error:', error);
        res.status(500).json({ message: 'Failed to send data to Telegram.' });
    }
});

// Health check route
app.get('/', (req, res) => {
    res.send('Medical Bot is running and using webhooks!');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
