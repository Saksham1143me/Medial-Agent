const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.BOT_API;
console.log(token);

const bot = new TelegramBot(token, {polling: true});

// When a user sends the /start command
let latestChatId=null
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    latestChatId=chatId;
    const message = `Hello! I am a medical bot. I will assist you. To fill this form <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">click here</a>.`;

    // Send the message with HTML formatting
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// When a user sends any regular text message

// server.js
const app = express();

// Middleware to parse JSON bodies from incoming requests
// This allows you to access JSON data sent in the request body via req.body
app.use(express.json());

// Define the port to listen on.
// It will try to use the PORT environment variable, otherwise default to 3000.
const PORT = process.env.PORT || 3000;

// Define a POST endpoint to receive data from Relay AI
// You can choose any path you like, e.g., '/webhook', '/relay-data', etc.
app.post('/relay-data', (req, res) => {
    if (!latestChatId) {
        return res.status(400).json({ message: 'No user has interacted with the bot yet.' });
    }

    bot.sendMessage(latestChatId, `Data: ${JSON.stringify(req.body)}`);
    res.status(200).json({ message: 'Sent to Telegram' });
});


// Basic GET route for testing if the server is running
app.get('/', (req, res) => {
    res.send('Relay AI Backend is running. Send POST requests to /relay-data');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running`);
    console.log(`Listening for data' on port ${PORT}`);
});