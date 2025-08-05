const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TOKEN = process.env.BOT_API;
const SERVER_URL = 'https://medial-agent.onrender.com'; // ← Replace if hosted elsewhere

// Setup bot with webhook
const bot = new TelegramBot(TOKEN, { webHook: { port: false } }); // port false = let Express handle it

// Set webhook on Telegram servers
bot.setWebHook(`${SERVER_URL}/bot${TOKEN}`);

// 1️⃣ Telegram will send updates here
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 2️⃣ Handle /start command — send form link
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const formLink = `<a href="https://forms.gle/6LNoSF4HDLBEcJRq6">📋 Fill out this form and enter chat id as ${chatId}</a>`;
  bot.sendMessage(chatId, formLink, { parse_mode: 'HTML' });
});

// 3️⃣ Your form hits this route: { chat_id, text }
app.post('/relay-data', (req, res) => {
  const { chat_id, text } = req.body;

  if (!chat_id || !text) {
    return res.status(400).send('❌ chat_id and text required');
  }

  bot.sendMessage(chat_id, text)
    .then(() => res.send('✅ Message sent to Telegram'))
    .catch(err => {
      console.error('Telegram error:', err.message);
      res.status(500).send('❌ Failed to send');
    });
});

// 4️⃣ Server listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
