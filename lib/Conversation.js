'use strict';
const Chat = require('./Chat');

class Conversation extends Chat {
  constructor(bot, userId) {
    super();
    this.bot = bot;
    this.userId = userId;
    this.context = {};
    this.start();
  }

  ask(question, answer, options) {
    if (!question || !answer || typeof answer !== 'function') {
      return console.error(`You need to specify a question and answer to ask`);
    }
    if (typeof question === 'function') {
      question.apply(this, [ this ]);
    } else {
      this.say(question, options);
    }
    this.listeningCallback = answer;
    return this;
  }

  respond(payload, data) {
    if (this.listeningCallback && typeof this.listeningCallback === 'function') {
      this.listeningCallback.apply(this, [ payload, this, data]);
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
}

module.exports = Conversation;
