const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const bot = new TelegramBot(process.env.BOT_API, { polling: true });

const client = new MongoClient(process.env.MONGO_URI);
let db;

client.connect().then(() => {
  db = client.db('telegramBot');
  console.log('✅ MongoDB connected');
});

// Utils
function generateToken() {
  return crypto.randomBytes(8).toString('hex');
}
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const token = generateToken();

  // Store token and chatId
  await db.collection('users').insertOne({ token, chatId });

  // Create form link with token
  const formUrl = `https://your-form.com?token=${token}`;
  bot.sendMessage(chatId, `📝 Please fill this form:\n${formUrl}`);
});

// Relay POST handler
app.post('/relay', async (req, res) => {
  const { token, result } = req.body;

  if (!token) {
    return res.status(400).send('❌ Missing token');
  }

  const user = await db.collection('users').findOne({ token });

  if (!user) {
    return res.status(404).send('❌ Token not found');
  }

  const chatId = user.chatId;
  await bot.sendMessage(chatId, `✅ Your form has been processed:\n\n${JSON.stringify(result, null, 2)}`);
  res.send('✅ Message sent to Telegram user');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
