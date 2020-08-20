const BootBot = require('../');
const express = require('express');
const app = express();
const config = require('config');

const bot = new BootBot({
    accessToken: config.get('access_token'),
    verifyToken: config.get('verify_token'),
    appSecret: config.get('app_secret')
});

bot.on('message', (payload, chat) => {
    const text = payload.message.text;
    chat.say(`Echo: ${text}`);
});

app.use(bot.middleware());

app.listen(3000, () => {
    console.log(`Listen on port 3000`);
});
