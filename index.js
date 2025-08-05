const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Replace this with your actual domain
const WEBHOOK_URL = `https://medial-agent.onrender.com`;

// === Telegram Bot Setup with Webhooks ===
const token = process.env.BOT_API;
const bot = new TelegramBot(token);

// Parse application/json
app.use(bodyParser.json());

// === Set Webhook ===
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// === Incoming messages from Telegram (webhook) ===
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// === /start command handler ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const html = `
<b>👋 Welcome!</b>

<a href="https://forms.gle/6LNoSF4HDLBEcJRq6">📋 Fill out this form</a> and enter <b>Chat ID</b> as <code>${chatId}</code>

🔗 Or send your data directly to: https://medial-agent.onrender.com/relay-data
`;

  bot.sendMessage(chatId, html, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
});

// === POST route to receive data and forward to Telegram chat ===
app.post('/relay-data', async (req, res) => {
  try {
    const { chat_id, text } = req.body;

    if (!chat_id || !text) {
      return res.status(400).send('❌ chat_id and text are required');
    }

    await bot.sendMessage(chat_id, text);
    res.send('✅ Message sent');

  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    res.status(500).send('❌ Failed to send');
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
