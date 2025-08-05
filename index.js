const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.BOT_API;
console.log(token);

const bot = new TelegramBot(token, {polling: true});

// When a user sends the /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = `Hello! I am a medical bot. I will assist you. To fill this form <a href="https://forms.gle/6LNoSF4HDLBEcJRq6">click here</a>.`;

    // Send the message with HTML formatting
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// When a user sends any regular text message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    // If the message is not /start, echo it back
    if (msg.text !== '/start') {
        bot.sendMessage(chatId, `You said: "${msg.text}"`);
    }
});
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
    console.log('Received data from Relay AI:');
    console.log(req.body); // The data sent by Relay AI will be in req.body

    // You can add your backend logic here to process the data:
    // - Save to a database
    // - Trigger other actions
    // - Perform calculations
    // etc.

    // Send a response back to Relay AI
    // It's good practice to send a status code and a message to acknowledge receipt
    res.status(200).json({
        message: 'Data received successfully!',
        receivedData: req.body // Optionally send back the received data for confirmation
    });
});

// Basic GET route for testing if the server is running
app.get('/', (req, res) => {
    res.send('Relay AI Backend is running. Send POST requests to /relay-data');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Listening for data on http://localhost:${PORT}/relay-data`);
});