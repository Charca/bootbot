'use strict';
const EventEmitter = require('eventemitter3');
const BootBot = require('./BootBot');

class Chat extends EventEmitter {
  /**
   * @param {BootBot} bot Bot instance.
   * @param {String} userId 
   */
  constructor(bot, userId) {
    super();
    if (!bot || !userId) {
      throw new Error('You need to specify a BootBot instance and a userId');
    }
    this.bot = bot;
    this.userId = userId;
  }

  /**
   * @typedef {Object} SendMessageOptions
   * @property {Boolean|Number} [typing=false] Send a typing indicator before sending the message. If set to true, it will automatically calculate how long it lasts based on the message length. If it's a number, it will show the typing indicator for that amount of milliseconds (max. 20000 - 20 seconds)
   * @property {Function} [onDelivery] Callback that will be executed when the message is received by the user. Receives params: (payload, chat, data)
   * @property {Function} [onRead] Callback that will be executed when the message is read by the user. Receives params: (payload, chat, data)
   */

  /**
   * A message object to be sent to a recipient.
   * @typedef {Object} Message
   * @property {String} text Message text. Previews will not be shown for the URLs in this field. Use attachment instead. Must be UTF-8 and has a 2000 character limit. text or attachment must be set.
   * @property {Attachment} attachment attachment object. Previews the URL. Used to send messages with media or Structured Messages. text or attachment must be set.
   * @property {Array.<QuickReply>} [quick_reply] Array of quick_reply to be sent with messages.
   * @property {String} [metadata] Custom string that is delivered as a message echo. 1000 character limit.
   */

  /**
   * @param {Message} message
   * @param {SendMessageOptions} options
   */
  say(message, options) {
    return this.bot.say(this.userId, message, options);
  }

  /**
   * See https://developers.facebook.com/docs/messenger-platform/reference/send-api/quick-replies/#quick_reply
   * @typedef {Object} QuickReply
   * @property {String} content_type
   * @property {String} title
   * @property {String|Number} payload
   * @property {String} [image_url]
   */

  /**
   * @param {String} text 
   * @param {Array.<QuickReply|String>} quickReplies Array of strings or quick_reply objects
   * @param {SendMessageOptions} [options] 
   */
  sendTextMessage(text, quickReplies, options) {
    return this.bot.sendTextMessage(this.userId, text, quickReplies, options);
  }

  /**
   * A button can be one of multiple types, see Messenger API docs for details.
   * https://developers.facebook.com/docs/messenger-platform/reference
   * @typedef {Object} Button
   */

  /**
   * @param {String} text Message to be sent.
   * @param {Array.<String|Button>} buttons
   * @param {SendMessageOptions} [options] 
   */
  sendButtonTemplate(text, buttons, options) {
    return this.bot.sendButtonTemplate(this.userId, text, buttons, options);
  }

  /**
   * @typedef {Object} Element
   * @property {String} title The title to display in the template. 80 character limit.
   * @property {String} [subtitle] The subtitle to display in the template. 80 character limit.
   * @property {String} [image_url] The URL of the image to display in the template.
   * @property {Object} [default_action] The default action executed when the template is tapped. Accepts the same properties as URL button, except title.
   * @property {Array.<Button>} buttons An array of buttons to append to the template. A maximum of 3 buttons per element is supported.
   */

  /**
   * @param {Array.<Element>} cards 
   * @param {SendMessageOptions} [options] 
   */
  sendGenericTemplate(cards, options) {
    return this.bot.sendGenericTemplate(this.userId, cards, options);
  }

  /**
   * @param {Array.<Element>} elements 
   * @param {Array.<String|Button>} buttons An array with one element: string or button object.
   * @param {SendMessageOptions} [options]
   * @param {String} [options.topElementStyle]
   */
  sendListTemplate(elements, buttons, options) {
    return this.bot.sendListTemplate(this.userId, elements, buttons, options);
  }

  /**
   * Use this method if you want to send a custom template payload, like a receipt template or an airline itinerary template.
   * @param {Object} payload The template payload.
   * @param {SendMessageOptions} [options]
   */
  sendTemplate(payload, options) {
    return this.bot.sendTemplate(this.userId, payload, options);
  }

  /**
   * @param {String} type Must be 'image', 'audio', 'video' or 'file'.
   * @param {String} url URL of the attachment.
   * @param {Array.<QuickReply>} quickReplies 
   * @param {SendMessageOptions} options 
   */
  sendAttachment(type, url, quickReplies, options) {
    return this.bot.sendAttachment(this.userId, type, url, quickReplies, options);
  }

  /**
   * Send an action.
   * To send a typing indicator in a more convenient way, see the .sendTypingIndicator method.
   * @param {String} action One of 'mark_seen', 'typing_on' or 'typing_off'
   * @param {SendMessageOptions} [options] NOT USED.
   */
  sendAction(action, options) {
    return this.bot.sendAction(this.userId, action, options);
  }

  /**
   * Use this method if you want to send a custom message object.
   * @param {Message} message The message to send.
   * @param {SendMessageOptions} [options] 
   */
  sendMessage(message, options) {
    return this.bot.sendMessage(this.userId, message, options);
  }

  /**
   * @param {Object} body The request body object.
   * @param {String} endpoint Messenger API endpoint
   * @param {String} method HTTP method.
   * @returns {Promise}
   */
  sendRequest(body, endpoint, method) {
    return this.bot.sendRequest(body, endpoint, method);
  }

  /**
   * Convinient method to send a typing_on action and then a typing_off action after milliseconds to simulate the bot is actually typing. Max value is 20000 (20 seconds).
   * @param {Number} milliseconds 
   */
  sendTypingIndicator(milliseconds) {
    return this.bot.sendTypingIndicator(this.userId, milliseconds);
  }

  /**
   * Returns a Promise that contains the user's profile information.
   */
  getUserProfile() {
    return this.bot.getUserProfile(this.userId);
  }

  /**
   * Starts a new conversation with the user.
   * @param {Function} factory Executed immediately receiving the convo instance as it's only param.
   */
  conversation(factory) {
    return this.bot.conversation(this.userId, factory);
  }
}

module.exports = Chat;
