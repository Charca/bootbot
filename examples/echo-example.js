'use strict';
const BootBot = require('../');
const config = require('config');

const bot = new BootBot({
  access_token: config.get('access_token'),
  verify_token: config.get('verify_token'),
  app_secret: config.get('app_secret')
});

bot.on('message', (payload, data) => {
  const text = payload.message.text;
  const senderId = payload.sender.id;

  if (data.captured) { return; }
  bot.sendTextMessage(`Echo: ${text}`, senderId);
});

bot.hear(['hello', /hi( .*)?/i], (payload, data) => {
  const text = payload.message.text;
  const senderId = payload.sender.id;
  const calledMe = (data.match) ? `You called me ${data.match[1]}` : ``;

  bot.sendTextMessage(`Oh! Hello there! ${calledMe}`, senderId);
});

bot.start();
