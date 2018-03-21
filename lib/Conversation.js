'use strict';
const Chat = require('./Chat');
const textMatchesPatterns = require('./utils/text-matches-patterns');
const BootBot = require('./BootBot');

class Conversation extends Chat {
  /**
   * Create a new conversation with a user.
   * @param {BootBot} bot Bot instance
   * @param {String} userId 
   */
  constructor(bot, userId) {
    super(bot, userId);
    this.bot = bot;
    this.userId = userId;
    this.context = {};
    this.waitingForAnswer = false;
    this.start();
  }

   /**
   * @typedef {Object} SendMessageOptions
   * @property {Boolean|Number} [typing=false] Send a typing indicator before sending the message. If set to true, it will automatically calculate how long it lasts based on the message length. If it's a number, it will show the typing indicator for that amount of milliseconds (max. 20000 - 20 seconds)
   * @property {Function} [onDelivery] Callback that will be executed when the message is received by the user. Receives params: (payload, chat, data)
   * @property {Function} [onRead] Callback that will be executed when the message is read by the user. Receives params: (payload, chat, data)
   */

  /**
   * If question is a string or an object, the .say() method will be invoked immediately with that string or object, if it's a function it will also be invoked immedately with the convo instance as its only param.
   * @param {String} question 
   * @param {Function} answer Receives the payload, convo and data params (similar to the callback function of the .on() or .hear() methods, except it receives the convo instance instead of the chat instance). The answer function will be called whenever the user replies to the question with a text message or quick reply.
   * @param {Array.<Function>} callbacks Used to listen to specific types of answers to the question. You can listen for postback, quick_reply and attachment events, or you can match a specific text pattern.
   * @param {SendMessageOptions} options 
   * @returns {this}
   */
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

  /**
   * @param {Object} payload 
   * @param {Object} data 
   */
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

  /**
   * Ends a conversation, giving control back to the bot instance. All .on() and .hear() listeners are now back in action. After you end a conversation the values that you saved using the convo.set() method are now lost.
   */
  end() {
    this.active = false;
    this.emit('end', this);
    return this;
  }

  /**
   * Retrieve a value from the conversation's context
   * @param {String} property 
   */
  get(property) {
    return this.context[property];
  }

  /**
   * Save a value in the conversation's context. This value will be available in all subsequent questions and answers that are part of this conversation, but the values are lost once the conversation ends.
   * @param {String} property
   * @param {*} value
   */
  set(property, value) {
    this.context[property] = value;
    return this.context[property];
  }
}

module.exports = Conversation;
