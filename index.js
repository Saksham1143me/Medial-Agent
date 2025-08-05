const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Telegram bot in webhook mode
const bot = new TelegramBot(process.env.BOT_API, { webHook: { port: false } });
const WEBHOOK_URL = 'https://medial-agent.onrender.com';
bot.setWebHook(`${WEBHOOK_URL}/bot${process.env.BOT_API}`);

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let db;

// Telegram webhook route
app.post(`/bot${process.env.BOT_API}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start command → send Google Form link and store chat ID
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await db.collection('singleton').updateOne(
    { key: 'chat' },
    { $set: { chatId } },
    { upsert: true }
  );

  const formLink = 'https://forms.gle/6LNoSF4HDLBEcJRq6';
  bot.sendMessage(chatId, `📝 Please fill out the form:\n<a href="${formLink}">${formLink}</a>`, {
    parse_mode: 'HTML'
  });
});

// /form command → show last received relay data
bot.onText(/\/form/, async (msg) => {
  const record = await db.collection('singleton').findOne({ key: 'relay' });
  const chatId = msg.chat.id;

  if (record?.data) {
    bot.sendMessage(chatId, `📨 Latest Form Data:\n\n<pre>${JSON.stringify(record.data, null, 2)}</pre>`, {
      parse_mode: 'HTML'
    });
  } else {
    bot.sendMessage(chatId, '❌ No form data received yet.');
  }
});

// /relay endpoint → receive data and send to user
app.post('/relay', async (req, res) => {
  const body = req.body;

  const record = await db.collection('singleton').findOne({ key: 'chat' });
  if (!record?.chatId) {
    return res.status(404).send('❌ No chat ID found');
  }

  // Save the relay data
  await db.collection('singleton').updateOne(
    { key: 'relay' },
    { $set: { data: body } },
    { upsert: true }
  );

  await bot.sendMessage(record.chatId, `✅ New form submitted:\n\n<pre>${JSON.stringify(body, null, 2)}</pre>`, {
    parse_mode: 'HTML'
  });

  res.send('✅ Relay sent to Telegram');
});

// Start app after DB connects
const start = async () => {
  try {
    await client.connect();
    db = client.db('telegramBot');
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Connection Failed:', err);
    process.exit(1);
  }
};

start();
