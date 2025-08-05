const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const token = process.env.BOT_API;
const bot = new TelegramBot(token);

// Webhook setup
const WEBHOOK_URL = 'https://medial-agent.onrender.com';
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

app.use(express.json());

// ✅ Store confirmed user
let confirmedChatId = null;

// 1. Handle Telegram webhook
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// 2. When user sends /start — send message + button
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const message = `🩺 Hello! I am your medical bot assistant.\n\n👉 Please fill this form: <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">Form Link</a>\n\nOnce done, click the button below.`;
    
    bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Sent', callback_data: 'form_submitted' }]
            ]
        }
    });
});

// 3. Handle callback when user clicks "✅ Sent"
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'form_submitted') {
        confirmedChatId = chatId;

        await bot.sendMessage(chatId, '✅ Thank you! I will send you updates as soon as they are available.');
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});

// 4. External endpoint that sends data to user
app.post('/relay-data', async (req, res) => {
    if (!confirmedChatId) {
        return res.status(400).json({ message: 'No user has confirmed form submission.' });
    }

    try {
        const loadingMsg = await bot.sendMessage(confirmedChatId, '⏳ Loading data...');
        const formatted = `<b>✅ Data Received:</b>\n<pre>${JSON.stringify(req.body, null, 2)}</pre>`;

        await bot.editMessageText(formatted, {
            chat_id: confirmedChatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'HTML'
        });

        res.status(200).json({ message: 'Data sent to user.' });
    } catch (err) {
        console.error('Telegram send error:', err);
        res.status(500).json({ message: 'Failed to send data to Telegram.' });
    }
});

// 5. Health check
app.get('/', (req, res) => {
    res.send('Medical bot running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot server running on port ${PORT}`);
});
