'use strict';
const BootBot = require('../');
const config = require('config');
const echoModule = require('./modules/echo');

const bot = new BootBot({
  accessToken: config.get('access_token'),
  verifyToken: config.get('verify_token'),
  appSecret: config.get('app_secret')
});

bot.module(echoModule);

bot.hear('hello', (payload, chat) => {
  const fields = ['locale', 'timezone', 'gender']; // change permissions
  chat.getUserProfile(fields).then((user) => {
    chat.say(`Hello, ${user.first_name}!`);
  });

  // or don't pass variable "fields"
  /* chat.getUserProfile().then((user) => {
    chat.say(`Hello, ${user.first_name}!`);
  }); */
});

bot.start();
