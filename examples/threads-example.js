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

bot.setGreetingText('Hey there! Welcome to BootBot!');
bot.setGetStartedButton((payload, chat) => {
  chat.say('Welcome to BootBot. What are you looking for?');
});
bot.setPersistentMenu([
  {
    type: 'postback',
    title: 'Help',
    payload: 'PERSISTENT_MENU_HELP'
  },
  {
    type: 'postback',
    title: 'Settings',
    payload: 'PERSISTENT_MENU_SETTINGS'
  },
  {
    type: 'web_url',
    title: 'Go to Website',
    url: 'http://yostik.io'
  }
]);

bot.on('postback:PERSISTENT_MENU_HELP', (payload, chat) => {
  chat.say(`I'm here to help!`);
});

bot.on('postback:PERSISTENT_MENU_SETTINGS', (payload, chat) => {
  chat.say(`Here are your settings: ...`);
});

bot.start();
