const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const token = process.env.BOT_API;
const bot = new TelegramBot(token, { webHook: { port: false } });

const WEBHOOK_URL = 'https://medial-agent.onrender.com';
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

app.use(express.json());

// ✅ Temporary in-memory buffer for one user at a time (stateless-like)
let latestRelayData = null;

// 1. Telegram webhook
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// 2. Send form link on /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const message = `🩺 Hello! I am your medical bot assistant.\n\n👉 Please fill this form: <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">Form Link</a>\n\nOnce done, send /form to view your result.`;

    bot.sendMessage(chatId, message, {
        parse_mode: 'HTML'
    });
});

// 3. Show data when user sends /form
bot.onText(/\/form/, async (msg) => {
    const chatId = msg.chat.id;

    if (!latestRelayData) {
        return bot.sendMessage(chatId, '⚠️ No form data received yet. Please try again later.');
    }

    try {
        const formatted = `<b>✅ Latest Form Data:</b>\n<pre>${JSON.stringify(latestRelayData, null, 2)}</pre>`;
        await bot.sendMessage(chatId, formatted, { parse_mode: 'HTML' });
    } catch (err) {
        console.error('Failed to send data:', err);
        await bot.sendMessage(chatId, '❌ Failed to load data.');
    }
});

// 4. External service posts data
app.post('/relay-data', (req, res) => {
    latestRelayData = req.body;
    console.log('Received new relay data:', latestRelayData);
    res.status(200).json({ message: 'Data stored temporarily. User can fetch it with /form.' });
});

// 5. Health check
app.get('/', (req, res) => {
    res.send('Medical bot running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
