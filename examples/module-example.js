'use strict';
const BootBot = require('../');
const config = require('config');
const echoModule = require('./modules/echo');
const helpModule = require('./modules/help');

const bot = new BootBot({
  access_token: config.get('access_token'),
  verify_token: config.get('verify_token'),
  app_secret: config.get('app_secret')
});

bot.module(echoModule);
bot.module(helpModule);
bot.start();
