'use strict';
const EventEmitter = require('eventemitter3');

class Chat extends EventEmitter {
  constructor(bot, userId) {
    super();
    if (!bot || !userId) {
      throw new Error('You need to specify a BootBot instance and a userId');
    }
    this.bot = bot;
    this.userId = userId;
  }

  say(message, options) {
    return this.bot.say(this.userId, message, options);
  }

  sendTextMessage(text, quickReplies, options) {
    return this.bot.sendTextMessage(this.userId, text, quickReplies, options);
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

  sendAttachment(type, url, quickReplies, options) {
    return this.bot.sendAttachment(this.userId, type, url, quickReplies, options);
  }

  sendAction(action, options) {
    return this.bot.sendAction(this.userId, action, options);
  }

  sendMessage(message, options) {
    return this.bot.sendMessage(this.userId, message, options);
  }

  sendRequest(body, endpoint, method) {
    return this.bot.sendRequest(body, endpoint, method);
  }

  sendTypingIndicator(milliseconds) {
    return this.bot.sendTypingIndicator(this.userId, milliseconds);
  }

  getUserProfile() {
    return this.bot.getUserProfile(this.userId);
  }

  conversation(factory) {
    return this.bot.conversation(this.userId, factory);
  }
}

module.exports = Chat;
