'use strict';
const Chat = require('./Chat');
const textMatchesPatterns = require('./utils/text-matches-patterns');

class Conversation extends Chat {
  constructor(bot, userId) {
    super(bot, userId);
    this.bot = bot;
    this.userId = userId;
    this.context = {};
    this.waitingForAnswer = false;
    this.start();
  }

  ask(question, answer, callbacks, options) {
    if (!question || !answer || typeof answer !== 'function') {
      return console.error(`You need to specify a question and answer to ask`);
    }
    if (typeof question === 'function') {
      question.apply(this, [ this ]);
    } else {
      this.say(question, options);
    }
    this.waitingForAnswer = true;
    this.listeningAnswer = answer;
    this.listeningCallbacks = Array.isArray(callbacks) ? callbacks : (callbacks ? [ callbacks ] : []);
    return this;
  }

  respond(payload, data) {
    if (!this.isWaitingForAnswer()) {
      // If the conversation has been started but no question has been asked yet,
      // ignore the response. This is usually caused by a race condition with long
      // typing indicators.
      return;
    }
    // Check for callbacks listening for postback or quick_reply
    if (data.type === 'postback' || data.type === 'quick_reply') {
      const postbackPayload = (data.type === 'postback') ? payload.postback.payload : payload.message.quick_reply.payload;
      const specificPostbackCallback = this.listeningCallbacks.find(callbackObject => (
        callbackObject.event === `${data.type}:${postbackPayload}`
      ));
      if (specificPostbackCallback && typeof specificPostbackCallback.callback === 'function') {
        this.stopWaitingForAnswer();
        return specificPostbackCallback.callback.apply(this, [ payload, this, data ]);
      }

      const genericPostbackCallback = this.listeningCallbacks.find(callbackObject => (
        callbackObject.event === data.type
      ));
      if (genericPostbackCallback && typeof genericPostbackCallback.callback === 'function') {
        this.stopWaitingForAnswer();
        return genericPostbackCallback.callback.apply(this, [ payload, this, data ]);
      }
    }

    // Check for a callback listening for an attachment
    if (data.type === 'attachment') {
      const attachmentCallback = this.listeningCallbacks.find(callbackObject => (
        callbackObject.event === 'attachment'
      ));
      if (attachmentCallback && typeof attachmentCallback.callback === 'function') {
        this.stopWaitingForAnswer();
        return attachmentCallback.callback.apply(this, [ payload, this, data ]);
      }
    }

    // Check for text messages that match a listening pattern
    const patternCallbacks = this.listeningCallbacks.filter(callbackObject => (
      callbackObject.pattern !== undefined
    ));
    if (data.type === 'message' && patternCallbacks.length > 0) {
      for (let i = 0; i < patternCallbacks.length; i += 1) {
        const match = textMatchesPatterns(payload.message.text, patternCallbacks[i].pattern);
        if (match !== false) {
          this.stopWaitingForAnswer();
          data.keyword = match.keyword;
          if (match.match) {
            data.match = match.match;
          }
          return patternCallbacks[i].callback.apply(this, [ payload, this, data ]);
        }
      }
    }

    // If event is a text message that contains a quick reply, and there's already a listening callback
    // for that quick reply that will be executed later, return without calling listeningAnswer
    if (data.type === 'message' && payload.message.quick_reply && payload.message.quick_reply.payload) {
      const quickReplyCallback = this.listeningCallbacks.find(callbackObject => (
        callbackObject.event === `quick_reply` || callbackObject.event === `quick_reply:${payload.message.quick_reply.payload}`
      ));
      if (quickReplyCallback && typeof quickReplyCallback.callback === 'function') {
        return;
      }
    }

    // If event is quick_reply at this point, it means there was no quick_reply callback listening,
    // and the message was already responded when the message event fired, so return without calling listeningAnswer
    if (data.type === 'quick_reply') {
      return;
    }

    if (this.listeningAnswer && typeof this.listeningAnswer === 'function') {
      // Solution for nested conversation.ask() by @hudgins
      const listeningAnswer = this.listeningAnswer;
      this.listeningAnswer = null;
      listeningAnswer.apply(this, [payload, this, data]);
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

  isWaitingForAnswer() {
    return this.waitingForAnswer;
  }

  stopWaitingForAnswer() {
    this.waitingForAnswer = false;
    this.listeningCallbacks = [];
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
