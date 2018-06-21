'use strict';
const BootBot = require('../');
const config = require('config');

/**
 * For your bot to manage multiple pages
 * 1. Subscribe your app to all the pages you want your bot to manage inside your app settings
 * 2. Get access tokens for all the pages
 * 3. Get your page IDs from facebook.com/pg/{your_page}/about/
 * 4. Initialize bootbot by setting access token with an object like the format below
 */
const bot = new BootBot({
  accessToken: {
    'PAGE_ONE_ID': 'PAGE_ONE_ACCESS_TOKEN',
    'PAGE_TWO_ID': 'PAGE_TWO_ACCESS_TOKEN',
  },
  verifyToken: config.get('verify_token'),
  appSecret: config.get('app_secret')
});

bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  if(chat.pageId === 'PAGE_ONE_ID') chat.say(`Echo page 1: ${text}`);
  else chat.say(`Echo other pages: ${text}`);
  // you can also send both pages the same message with out checking chat.pageId
});

bot.start();
