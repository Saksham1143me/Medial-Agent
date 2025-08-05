const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_API;

const bot = new TelegramBot(TOKEN, { polling: true });
app.use(bodyParser.json());

// Handle /start message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `Welcome! 🔗 To send data, POST to /relay-data with JSON:\n\n{\n  "chat_id": "${chatId}",\n  "text": "Your message"\n}`;
  bot.sendMessage(chatId, welcomeMessage);
});

// Handle external POST to /relay-data
app.post('/relay-data', async (req, res) => {
  try {
    let { chat_id, text } = req.body;

    if (!chat_id || !text) {
      return res.status(400).send("❌ chat_id and text are required");
    }

    chat_id = chat_id.toString().trim(); // Ensure it's clean
    await bot.sendMessage(chat_id, text);

    console.log(`✅ Message sent to chat_id: ${chat_id}`);
    res.send("✅ Message sent to Telegram");
  } catch (error) {
    console.error("❌ Error in /relay-data:", error.message);
    res.status(500).send("❌ Failed to send");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
