'use strict';
const BootBot = require('../');
const config = require('config');
const echoModule = require('./modules/echo');

const bot = new BootBot({
  accessToken: config.get('access_token'),
  verifyToken: config.get('verify_token'),
  appSecret: config.get('app_secret')
});

// Setting this to true would disable the text input on mobile
// and the user will only be able to communicate via the persistent menu.
const disableInput = false;

bot.module(echoModule);

bot.setPersistentMenu([
  {
    title: 'My Account',
    type: 'nested',
    call_to_actions: [
      {
        title: 'Pay Bill',
        type: 'postback',
        payload: 'PAYBILL_PAYLOAD'
      },
      {
        title: 'History',
        type: 'postback',
        payload: 'HISTORY_PAYLOAD'
      },
      {
        title: 'Contact Info',
        type: 'postback',
        payload: 'CONTACT_INFO_PAYLOAD'
      }
    ]
  },
  {
    title: 'Go to Website',
    type: 'web_url',
    url: 'http://purple.com'
  }
], disableInput);

bot.on('postback:PAYBILL_PAYLOAD', (payload, chat) => {
  chat.say(`Pay Bill here...`);
});

bot.on('postback:HISTORY_PAYLOAD', (payload, chat) => {
  chat.say(`History here...`);
});

bot.on('postback:CONTACT_INFO_PAYLOAD', (payload, chat) => {
  chat.say(`Contact info here...`);
});

bot.start();
