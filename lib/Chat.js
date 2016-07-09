'use strict';
const EventEmitter = require('eventemitter3');

class Chat extends EventEmitter {
  constructor(bot, userId) {
    super();
    this.bot = bot;
    this.userId = userId;
  }

  say(message, options) {
    return this.bot.say(this.userId, message, options);
  }

  sendTextMessage(text, options) {
    return this.bot.sendTextMessage(this.userId, text, options);
  }

  sendButtonTemplate(text, buttons, options) {
    return this.bot.sendButtonTemplate(this.userId, text, buttons, options);
  }

  sendGenericTemplate(cards, options) {
    return this.bot.sendGenericTemplate(this.userId, cards, options);
  }

  sendTemplate(payload, options) {
    return this.bot.sendTemplate(this.userId, payload, options);
  }

  sendAttachment(type, url, options) {
    return this.bot.sendAttachment(this.userId, type, url, options);
  }

  sendAction(action, options) {
    return this.bot.sendAction(this.userId, action, options);
  }

  sendMessage(message, options) {
    return this.bot.sendMessage(this.userId, message, options);
  }

  sendRequest(body, options) {
    return this.bot.sendRequest(this.userId, body, options);
  }

  sendTypingIndicator(milliseconds) {
    return this.bot.sendTypingIndicator(this.userId, milliseconds);
  }

  conversation(factory) {
    return this.bot.conversation(this.userId, factory);
  }
}

module.exports = Chat;
