'use strict';
const Chat = require('./Chat');
const Conversation = require('./Conversation');
const EventEmitter = require('eventemitter3');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');
const normalizeString = require('./utils/normalize-string');

class BootBot extends EventEmitter {
  /**
   * Creates a new BootBot instance. Instantiates the new express app and all required webhooks. options param must contain all tokens and app secret of your Facebook app. Optionally, set broadcastEchoes to true if you want the messages your bot send to be echoed back to it (you probably don't need this feature unless you have multiple bots running on the same Facebook page).
   * If you want to specify a custom endpoint name for your webhook, you can do it with the webhook option.
   * @param {Object} options
   * @param {String} options.accessToken
   * @param {String} options.verifyToken
   * @param {String} options.appSecret
   * @param {String} [options.webhook=/webhook]
   * @param {Boolean} [options.broadcastEchoes=false]
   */
  constructor(options) {
    super();
    if (!options || (options && (!options.accessToken || !options.verifyToken || !options.appSecret))) {
      throw new Error('You need to specify an accessToken, verifyToken and appSecret');
    }
    this.accessToken = options.accessToken;
    this.verifyToken = options.verifyToken;
    this.appSecret = options.appSecret;
    this.broadcastEchoes = options.broadcastEchoes || false;
    this.app = express();
    this.webhook = options.webhook || '/webhook';
    this.webhook = this.webhook.charAt(0) !== '/' ? `/${this.webhook}` : this.webhook;
    this.app.use(bodyParser.json({ verify: this._verifyRequestSignature.bind(this) }));
    this._hearMap = [];
    this._conversations = [];
  }

  /**
   * Starts the express server on the specified port. Defaults port to 3000.
   * @param {Number} [port=3000]
   */
  start(port) {
    this._initWebhook();
    this.app.set('port', port || 3000);
    this.server = this.app.listen(this.app.get('port'), () => {
      const portNum = this.app.get('port');
      console.log('BootBot running on port', portNum);
      console.log(`Facebook Webhook running on localhost:${portNum}${this.webhook}`);
    });
  }

  /**
   * Closes the express server (calls `.close()` on the server instance).
   */
  close() {
    this.server.close();
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
   * @typedef {Object} SendMessageOptions
   * @property {Boolean|Number} [typing=false] Send a typing indicator before sending the message. If set to true, it will automatically calculate how long it lasts based on the message length. If it's a number, it will show the typing indicator for that amount of milliseconds (max. 20000 - 20 seconds)
   * @property {String} [messagingType='RESPONSE'] The messaging type of the message being sent.
   * @property {String} [notificationType] Push notification type: REGULAR: sound/vibration - SILENT_PUSH: on-screen notification only - NO_PUSH: no notification.
   * @property {String} [tag] The message tag string.
   * @property {Function} [onDelivery] Callback that will be executed when the message is received by the user. Receives params: (payload, chat, data)
   * @property {Function} [onRead] Callback that will be executed when the message is read by the user. Receives params: (payload, chat, data)
   */

  /**
   * @param {Recipient|Object} recipientId Recipient object or ID.
   * @param {String} text
   * @param {Array.<QuickReply|String>} quickReplies Array of strings or quick_reply objects
   * @param {SendMessageOptions} [options]
   */
  sendTextMessage(recipientId, text, quickReplies, options) {
    const message = { text };
    const formattedQuickReplies = this._formatQuickReplies(quickReplies);
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies;
    }
    return this.sendMessage(recipientId, message, options);
  }

  /**
   * A button can be one of multiple types, see Messenger API docs for details.
   * https://developers.facebook.com/docs/messenger-platform/reference
   * @typedef {Object} Button
   */

  /**
   * @param {Recipient|String} recipientId
   * @param {String} text Message to be sent.
   * @param {Array.<String|Button>} buttons
   * @param {SendMessageOptions} [options]
   */
  sendButtonTemplate(recipientId, text, buttons, options) {
    const payload = {
      template_type: 'button',
      text
    };
    const formattedButtons = this._formatButtons(buttons);
    payload.buttons = formattedButtons;
    return this.sendTemplate(recipientId, payload, options);
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
   * @param {Recipient|String} recipientId
   * @param {Array.<Element>} elements
   * @param {SendMessageOptions} [options]
   */
  sendGenericTemplate(recipientId, elements, options) {
    const payload = {
      template_type: 'generic',
      elements
    };
    options && options.imageAspectRatio && (payload.image_aspect_ratio = options.imageAspectRatio) && (delete options.imageAspectRatio);
    return this.sendTemplate(recipientId, payload, options);
  }

  /**
   * @param {Recipient|String} recipientId
   * @param {Array.<Element>} elements
   * @param {Array.<String|Button>} buttons An array with one element: string or button object.
   * @param {SendMessageOptions} [options]
   * @param {String} [options.topElementStyle]
   */
  sendListTemplate(recipientId, elements, buttons, options) {
    const payload = {
      template_type: 'list',
      elements
    };
    options && options.topElementStyle && (payload.top_element_style = options.topElementStyle) && (delete options.topElementStyle);
    buttons && buttons.length && (payload.buttons = this._formatButtons([buttons[0]]));
    return this.sendTemplate(recipientId, payload, options);
  }

  /**
   * Use this method if you want to send a custom template payload, like a receipt template or an airline itinerary template.
   * @param {Recipient|String} recipientId
   * @param {Object} payload The template payload.
   * @param {SendMessageOptions} [options]
   */
  sendTemplate(recipientId, payload, options) {
    const message = {
      attachment: {
        type: 'template',
        payload
      }
    };
    return this.sendMessage(recipientId, message, options);
  }

  /**
   * @param {Recipient|String} recipientId
   * @param {String} type Must be 'image', 'audio', 'video' or 'file'.
   * @param {String} url URL of the attachment.
   * @param {Array.<QuickReply>} quickReplies
   * @param {SendMessageOptions} options
   */
  sendAttachment(recipientId, type, url, quickReplies, options) {
    const message = {
      attachment: {
        type,
        payload: { url }
      }
    };
    const formattedQuickReplies = this._formatQuickReplies(quickReplies);
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies;
    }
    return this.sendMessage(recipientId, message, options);
  }

  /**
   * Send an action.
   * To send a typing indicator in a more convenient way, see the .sendTypingIndicator method.
   * @param {Recipient|String} recipientId Recipient object or ID.
   * @param {String} action One of 'mark_seen', 'typing_on' or 'typing_off'
   * @param {SendMessageOptions} [options] NOT USED.
   */
  sendAction(recipientId, action, options) {
    const recipient = this._createRecipient(recipientId);
    return this.sendRequest({
      recipient,
      sender_action: action
    });
  }

  /**
   * A message object to be sent to a recipient.
   * @typedef {Object} Message
   * @property {String} text Message text. Previews will not be shown for the URLs in this field. Use attachment instead. Must be UTF-8 and has a 2000 character limit. text or attachment must be set.
   * @property {Attachment} attachment attachment object. Previews the URL. Used to send messages with media or Structured Messages. text or attachment must be set.
   * @property {Array.<QuickReply>} [quick_reply] Array of quick_reply to be sent with messages.
   * @property {String} [metadata] Custom string that is delivered as a message echo. 1000 character limit.
   */

  /**
   * Use this method if you want to send a custom message object.
   * @param {Recipient|String} recipientId Recipient object or ID.
   * @param {Message} message The message to send.
   * @param {SendMessageOptions} [options]
   */
  sendMessage(recipientId, message, options) {
    const recipient = this._createRecipient(recipientId);
    const messagingType = options && options.messagingType;
    const notificationType = options && options.notificationType;
    const tag = options && options.tag;
    const onDelivery = options && options.onDelivery;
    const onRead = options && options.onRead;
    const reqBody = {
      recipient,
      message,
      messaging_type: messagingType || 'RESPONSE'
    };

    // These are optional params, only add them to the request body
    // if they're defined.
    if (notificationType) {
      reqBody.notification_type = notificationType
    }
    if (tag) {
      reqBody.tag = tag
    }
    const req = () => (
      this.sendRequest(reqBody).then((json) => {
        if (typeof onDelivery === 'function') {
          this.once('delivery', onDelivery);
        }
        if (typeof onRead === 'function') {
          this.once('read', onRead);
        }
        return json;
      })
    );
    if (options && options.typing) {
      const autoTimeout = (message && message.text) ? message.text.length * 10 : 1000;
      const timeout = (typeof options.typing === 'number') ? options.typing : autoTimeout;
      return this.sendTypingIndicator(recipientId, timeout).then(req);
    }
    return req();
  }

  /**
   * @param {Object} body The request body object.
   * @param {String} endpoint Messenger API endpoint
   * @param {String} method HTTP method.
   * @returns {Promise}
   */
  sendRequest(body, endpoint, method) {
    endpoint = endpoint || 'messages';
    method = method || 'POST';
    return fetch(`https://graph.facebook.com/v2.12/me/${endpoint}?access_token=${this.accessToken}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(res => {
      if (res.error) {
        console.log('Messenger Error received. For more information about error codes, see: https://goo.gl/d76uvB');
        console.log(res.error);
      }
      return res;
    })
    .catch(err => console.log(`Error sending message: ${err}`));
  }

  /**
   * Thread API has been replaced by the Messenger Profile API.
   * Please update your code to use the sendProfileRequest() method instead.
   * @param {Object} body
   * @param {String} method
   */
  sendThreadRequest(body, method) {
    console.warning(`
      sendThreadRequest: Dreprecation warning. Thread API has been replaced by the Messenger Profile API.
      Please update your code to use the sendProfileRequest() method instead.`
    );
    return this.sendRequest(body, 'thread_settings', method);
  }

  /**
   * @param {Object} body The request body.
   * @param {String} method HTTP method.
   */
  sendProfileRequest(body, method) {
    return this.sendRequest(body, 'messenger_profile', method);
  }

  /**
   * Convinient method to send a typing_on action and then a typing_off action after milliseconds to simulate the bot is actually typing. Max value is 20000 (20 seconds).
   * @param {Recipient|String} recipientId
   * @param {Number} milliseconds
   */
  sendTypingIndicator(recipientId, milliseconds) {
    const timeout = isNaN(milliseconds) ? 0 : milliseconds;
    if (milliseconds > 20000) {
      milliseconds = 20000;
      console.error('sendTypingIndicator: max milliseconds value is 20000 (20 seconds)');
    }
    return new Promise((resolve, reject) => {
      return this.sendAction(recipientId, 'typing_on').then(() => {
        setTimeout(() => this.sendAction(recipientId, 'typing_off').then((json) => resolve(json)), timeout);
      });
    });
  }

  /**
   * Returns a Promise that contains the user's profile information.
   * @param {String} userId
   * @returns {Promise}
   */
  getUserProfile(userId) {
    const url = `https://graph.facebook.com/v2.12/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.accessToken}`;
    return fetch(url)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`));
  }

  /**
   * Set a greeting text for new conversations. The Greeting Text is only rendered the first time the user interacts with a the Page on Messenger.
   * Facebook docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/greeting
   * @param {String|Array.<Object>} text Greeting text, or an array of objects to support multiple locales. For more info on the format of these objects, see: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/greeting
   */
  setGreetingText(text) {
    const greeting = (typeof text !== 'string') ? text : [{
      locale: 'default',
      text
    }];
    return this.sendProfileRequest({ greeting });
  }

  /**
   * React to a user starting a conversation with the bot by clicking the Get Started button.
   * Facebook docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/get-started-button
   * @param {String|Function} action If action is a string, the Get Started button postback will be set to that string. If it's a function, that callback will be executed when a user clicks the Get Started button.
   */
  setGetStartedButton(action) {
    const payload = (typeof action === 'string') ? action : 'BOOTBOT_GET_STARTED';
    if (typeof action === 'function') {
      this.on(`postback:${payload}`, action);
    }
    return this.sendProfileRequest({
      get_started: {
        payload
      }
    });
  }

  /**
   * Removes the Get Started button call to action.
   */
  deleteGetStartedButton() {
    return this.sendProfileRequest({
      fields: [
        'get_started'
      ]
    }, 'DELETE');
  }

  /**
   * Creates a Persistent Menu that is available at any time during the conversation. The buttons param can be an array of strings, button objects, or locale objects.
   * Facebook docs: https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/persistent-menu
   * @param {Array.<String|Button>} buttons If buttons is an array of objects containing a locale attribute, it will be used as-is, expecting it to be an array of localized menues. For more info on the format of these objects, see the documentation.
   * @param {boolean} [disableInput=false] If disableInput is set to true, it will disable user input in the menu. The user will only be able to interact with the bot via the menu, postbacks, buttons and webviews.
   */
  setPersistentMenu(buttons, disableInput) {
    if (buttons && buttons[0] && buttons[0].locale !== undefined) {
      // Received an array of locales, send it as-is.
      return this.sendProfileRequest({ persistent_menu: buttons });
    }
    // If it's not an array of locales, we'll assume is an array of buttons.
    const formattedButtons = this._formatButtons(buttons);
    return this.sendProfileRequest({
      persistent_menu: [{
        locale: 'default',
        composer_input_disabled: disableInput || false,
        call_to_actions: formattedButtons
      }]
    });
  }

  /**
   * Removes the Persistent Menu.
   */
  deletePersistentMenu() {
    return this.sendProfileRequest({
      fields: [
        'persistent_menu'
      ]
    }, 'DELETE');
  }

  /**
   * Send a message to the user. The .say() method can be used to send text messages, button messages, messages with quick replies or attachments. If you want to send a different type of message (like a generic template), see the Send API method for that specific type of message.
   * @param {Recipient|String} recipientId Recipient or recipient's ID.
   * @param {String|Array|Message} message
   * @param {SendMessageOptions} options
   * @returns {Promise}
   */
  say(recipientId, message, options) {
    if (typeof message === 'string') {
      return this.sendTextMessage(recipientId, message, [], options);
    } else if (message && message.text) {
      if (message.quickReplies && message.quickReplies.length > 0) {
        return this.sendTextMessage(recipientId, message.text, message.quickReplies, options);
      } else if (message.buttons && message.buttons.length > 0) {
        return this.sendButtonTemplate(recipientId, message.text, message.buttons, options);
      }
    } else if (message && message.attachment) {
      return this.sendAttachment(recipientId, message.attachment, message.url, message.quickReplies, options);
    } else if (message && message.elements && message.buttons) {
      return this.sendListTemplate(recipientId, message.elements, message.buttons, options);
    } else if (message && message.cards) {
      return this.sendGenericTemplate(recipientId, message.cards, options);
    } else if (Array.isArray(message)) {
      return message.reduce((promise, msg) => {
        return promise.then(() => this.say(recipientId, msg, options));
      }, Promise.resolve());
    }
    console.error('Invalid format for .say() message.');
  }

  /**
   * A convinient method to subscribe to message events containing specific keywords. The keyword param can be a string, a regex or an array of both strings and regexs that will be tested against the received message. If the bot receives a message that matches any of the keywords, it will execute the specified callback. String keywords are case-insensitive, but regular expressions are not case-insensitive by default, if you want them to be, specify the i flag.
   * @param {String|Regex|Array} keywords
   * @param {Function} callback
   */
  hear(keywords, callback) {
    keywords = Array.isArray(keywords) ? keywords : [keywords];
    keywords.forEach(keyword => this._hearMap.push({ keyword, callback }));
    return this;
  }

  /**
   * Modules are simple functions that you can use to organize your code in different files and folders.
   * @param {Function} factory Called immediatly and receives the bot instance as its only parameter.
   */
  module(factory) {
    return factory.apply(this, [this]);
  }

  /**
   * Starts a new conversation with the user.
   * @param {Recipient|String} recipientId
   * @param {Function} factory Executed immediately receiving the convo instance as it's only param.
   */
  conversation(recipientId, factory) {
    if (!recipientId || !factory || typeof factory !== 'function') {
      return console.error(`You need to specify a recipient and a callback to start a conversation`);
    }
    const convo = new Conversation(this, recipientId);
    this._conversations.push(convo);
    convo.on('end', (endedConvo) => {
      const removeIndex = this._conversations.indexOf(endedConvo);
      this._conversations.splice(removeIndex, 1);
    });
    factory.apply(this, [convo]);
    return convo;
  }

  /**
   * Used to format an array of button titles to Button objects.
   * @param {Array.<String|Button>} buttons If there are Button objects in the array they are not modified.
   */
  _formatButtons(buttons) {
    return buttons && buttons.map((button) => {
      if (typeof button === 'string') {
        return {
          type: 'postback',
          title: button,
          payload: 'BOOTBOT_BUTTON_' + normalizeString(button)
        };
      } else if (button && button.type) {
        return button;
      }
      return {};
    });
  }

  /**
   * Used to format QuickReply objects or titles into the correct format to be consumed by the Facebook API.
   * @param {Array.<QuickReply|String>} quickReplies
   */
  _formatQuickReplies(quickReplies) {
    return quickReplies && quickReplies.map((reply) => {
      if (typeof reply === 'string') {
        return {
          content_type: 'text',
          title: reply,
          payload: 'BOOTBOT_QR_' + normalizeString(reply)
        };
      } else if (reply && reply.title) {
        return Object.assign({
          content_type: 'text',
          payload: 'BOOTBOT_QR_' + normalizeString(reply.title)
        }, reply);
      }
      return reply;
    });
  }

  /**
   * @param {String} type
   * @param {Object} event
   * @param {Object} data
   */
  _handleEvent(type, event, data) {
    const recipient = (type === 'authentication' && !event.sender) ? { user_ref: event.optin.user_ref } : event.sender.id;
    const chat = new Chat(this, recipient);
    this.emit(type, event, chat, data);
  }

  _handleMessageEvent(event) {
    if (this._handleConversationResponse('message', event)) { return; }
    const text = event.message.text;
    const senderId = event.sender.id;
    let captured = false;
    if (!text) { return; }

    this._hearMap.forEach(hear => {
      if (typeof hear.keyword === 'string' && hear.keyword.toLowerCase() === text.toLowerCase()) {
        const res = hear.callback.apply(this, [event, new Chat(this, senderId), {
          keyword: hear.keyword,
          captured
        }]);
        captured = true;
        return res;
      } else if (hear.keyword instanceof RegExp && hear.keyword.test(text)) {
        const res = hear.callback.apply(this, [event, new Chat(this, senderId), {
          keyword: hear.keyword,
          match: text.match(hear.keyword),
          captured
        }]);
        captured = true;
        return res;
      }
    });

    this._handleEvent('message', event, { captured });
  }

  _handleAttachmentEvent(event) {
    if (this._handleConversationResponse('attachment', event)) { return; }
    this._handleEvent('attachment', event);
  }

  _handlePostbackEvent(event) {
    if (this._handleConversationResponse('postback', event)) { return; }
    const payload = event.postback.payload;
    if (payload) {
      this._handleEvent(`postback:${payload}`, event);
    }
    this._handleEvent('postback', event);
  }

  _handleQuickReplyEvent(event) {
    if (this._handleConversationResponse('quick_reply', event)) { return; }
    const payload = event.message.quick_reply && event.message.quick_reply.payload;
    if (payload) {
      this._handleEvent(`quick_reply:${payload}`, event);
    }
    this._handleEvent('quick_reply', event);
  }

  _handleConversationResponse(type, event) {
    const userId = event.sender.id;
    let captured = false;
    this._conversations.forEach(convo => {
      if (userId && userId === convo.userId && convo.isActive()) {
        captured = true;
        return convo.respond(event, { type });
      }
    });
    return captured;
  }

  /**
   * A recipient of a message.
   * @typedef {Object} Recipient
   * @property {String} id The recipient's unique ID.
   */

  /**
   * Create a recipient object.
   * @param {Object|String} recipient A recipient object of ID.
   * @returns {Recipient}
   */
  _createRecipient(recipient) {
    return (typeof recipient === 'object') ? recipient : { id: recipient };
  }


  _initWebhook() {
    this.app.get(this.webhook, (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.verifyToken) {
        console.log('Validation Succeded.')
        res.status(200).send(req.query['hub.challenge']);
      } else {
        console.error('Failed validation. Make sure the validation tokens match.');
        res.sendStatus(403);
      }
    });

    this.app.post(this.webhook, (req, res) => {
      var data = req.body;
      if (data.object !== 'page') {
        return;
      }

      this.handleFacebookData(data);

      // Must send back a 200 within 20 seconds or the request will time out.
      res.sendStatus(200);
    }).bind(this);
  }

  /**
   * Use this to send a message from a parsed webhook message directly to your bot.
   * @param {Object} data
   */
  handleFacebookData(data) {
    // Iterate over each entry. There may be multiple if batched.
    data.entry.forEach((entry) => {
      // Iterate over each messaging event
      entry.messaging.forEach((event) => {
        if (event.message && event.message.is_echo && !this.broadcastEchoes) {
          return;
        }
        if (event.optin) {
          this._handleEvent('authentication', event);
        } else if (event.message && event.message.text) {
          this._handleMessageEvent(event);
          if (event.message.quick_reply) {
            this._handleQuickReplyEvent(event);
          }
        } else if (event.message && event.message.attachments) {
          this._handleAttachmentEvent(event);
        } else if (event.postback) {
          this._handlePostbackEvent(event);
        } else if (event.delivery) {
          this._handleEvent('delivery', event);
        } else if (event.read) {
          this._handleEvent('read', event);
        } else if (event.account_linking) {
          this._handleEvent('account_linking', event);
        } else if (event.referral) {
          this._handleEvent('referral', event);
        } else {
          console.log('Webhook received unknown event: ', event);
        }
      });
    });
  }

  _verifyRequestSignature(req, res, buf) {
    var signature = req.headers['x-hub-signature'];
    if (!signature) {
      throw new Error('Couldn\'t validate the request signature.');
    } else {
      var elements = signature.split('=');
      var method = elements[0];
      var signatureHash = elements[1];
      var expectedHash = crypto.createHmac('sha1', this.appSecret)
        .update(buf)
        .digest('hex');

      if (signatureHash != expectedHash) {
        throw new Error('Couldn\'t validate the request signature.');
      }
    }
  }
}

module.exports = BootBot;
