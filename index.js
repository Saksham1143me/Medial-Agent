const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Your bot token and Mongo URI from environment
const token = process.env.BOT_API;
const mongoUri = process.env.MONGO_URI;

// Initialize Telegram bot with webhook mode
const bot = new TelegramBot(token, { webHook: { port: false } });

// Set your webhook URL (Render deployed URL)
const WEBHOOK_URL = 'https://medial-agent.onrender.com';
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// Connect to MongoDB
const client = new MongoClient(mongoUri);
let db;

client.connect().then(() => {
  db = client.db('telegramBot');
  console.log('✅ MongoDB connected');
});

// Webhook endpoint for Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Google Form link
const GOOGLE_FORM_URL = 'https://forms.gle/6LNoSF4HDLBEcJRq6';

// /start command: send form link and store chatId
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Store or update the chatId in Mongo (for single-user mode)
  await db.collection('singleton').updateOne(
    { key: 'chat' },
    { $set: { chatId } },
    { upsert: true }
  );

  const message = `🩺 Hello! I am your medical bot assistant.\n\n👉 Please fill this form: <a href="${GOOGLE_FORM_URL}">Form Link</a>\n\nOnce done, send /form to view your results.`;

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML'
  });
});

// /form command: show latest submitted data
bot.onText(/\/form/, async (msg) => {
  const chatId = msg.chat.id;

  const record = await db.collection('singleton').findOne({ key: 'relayData' });

  if (!record || !record.data) {
    return bot.sendMessage(chatId, '⚠️ No form data received yet.');
  }

  const formatted = `<b>✅ Latest Form Data:</b>\n<pre>${JSON.stringify(record.data, null, 2)}</pre>`;

  bot.sendMessage(chatId, formatted, { parse_mode: 'HTML' });
});

// External webhook to receive data from Google Form (via Apps Script or API)
app.post('/relay', async (req, res) => {
  const data = req.body;

  // Store latest data in Mongo
  await db.collection('singleton').updateOne(
    { key: 'relayData' },
    { $set: { data } },
    { upsert: true }
  );

  const chatRecord = await db.collection('singleton').findOne({ key: 'chat' });

  if (!chatRecord || !chatRecord.chatId) {
    return res.status(404).send('❌ No chat ID found');
  }

  await bot.sendMessage(chatRecord.chatId, `✅ Form data received! Use /form to view it.`);

  res.send('✅ Data stored and user notified.');
});

// Health check
app.get('/', (req, res) => {
  res.send('🤖 Telegram bot is running via webhook.');
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
