'use strict';
const EventEmitter = require('eventemitter3');

class Conversation extends EventEmitter {
  constructor(bot, userId) {
    super();
    this.bot = bot;
    this.userId = userId;
    this.context = {};
    this.start();
  }

  ask(question, answer) {
    if (!question || !answer || typeof answer !== 'function') {
      return console.error(`You need to specify a question and answer to ask`);
    }
    if (typeof question === 'string') {
      this.say(question);
    } else if (typeof question === 'function') {
      question.apply(this, [ this ]);
    } else {
      return console.error(`Your question needs to be a string or function`);
    }
    this.listeningCallback = answer;
    return this;
  }

  respond(payload, data) {
    if (this.listeningCallback && typeof this.listeningCallback === 'function') {
      this.listeningCallback.apply(this, [ payload, data, this]);
      this.listeningCallback = null;
      return this;
    }
    // Conversation is still active, but there's no callback waiting for a response.
    // This probably means you forgot to call convo.end(); in your last callback.
    // We'll end the convo but this message is probably lost in time and space.
    return this.end();
  }

  isActive() {
    return this.active;
  }

  start() {
    this.active = true;
    this.emit('start', this);
    return this;
  }

  end() {
    this.active = false;
    this.emit('end', this);
    return this;
  }

  get(property) {
    return this.context[property];
  }

  set(property, value) {
    this.context[property] = value;
    return this.context[property];
  }

  say(text) {
    return this.bot.say(text, this.userId);
  }

  sendTextMessage(text) {
    return this.bot.sendTextMessage(text, this.userId);
  }

  sendButtonMessage(text, buttons) {
    return this.bot.sendButtonMessage(text, buttons, this.userId);
  }

  sendGenericTemplate(cards) {
    return this.bot.sendGenericTemplate(cards, this.userId);
  }
}

module.exports = Conversation;
