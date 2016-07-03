'use strict';
const BootBot = require('../');
const config = require('config');

const bot = new BootBot({
  access_token: config.get('access_token'),
  verify_token: config.get('verify_token'),
  app_secret: config.get('app_secret')
});

bot.on('message', (payload) => {
  const text = payload.message.text;
  const senderId = payload.sender.id;

  bot.sendTextMessage(`Echo: ${text}`, senderId);
});

bot.start();

console.log(process.env.NODE_ENV);