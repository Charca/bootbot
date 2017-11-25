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

  start(port) {
    this._initWebhook();
    this.app.set('port', port || 3000);
    this.server = this.app.listen(this.app.get('port'), () => {
      const portNum = this.app.get('port');
      console.log('BootBot running on port', portNum);
      console.log(`Facebook Webhook running on localhost:${portNum}${this.webhook}`);
    });
  }

  close() {
    this.server.close();
  }

  sendTextMessage(recipientId, text, quickReplies, options) {
    const message = { text };
    const formattedQuickReplies = this._formatQuickReplies(quickReplies);
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies;
    }
    return this.sendMessage(recipientId, message, options);
  }

  sendButtonTemplate(recipientId, text, buttons, options) {
    const payload = {
      template_type: 'button',
      text
    };
    const formattedButtons = this._formatButtons(buttons);
    payload.buttons = formattedButtons;
    return this.sendTemplate(recipientId, payload, options);
  }

  sendGenericTemplate(recipientId, elements, options) {
    const payload = {
      template_type: 'generic',
      elements
    };
    options && options.imageAspectRatio && (payload.image_aspect_ratio = options.imageAspectRatio) && (delete options.imageAspectRatio);
    return this.sendTemplate(recipientId, payload, options);
  }

  sendListTemplate(recipientId, elements, buttons, options) {
    const payload = {
      template_type: 'list',
      elements
    };
    options && options.topElementStyle && (payload.top_element_style = options.topElementStyle) && (delete options.topElementStyle);
    buttons && buttons.length && (payload.buttons = this._formatButtons([buttons[0]]));
    return this.sendTemplate(recipientId, payload, options);
  }

  sendTemplate(recipientId, payload, options) {
    const message = {
      attachment: {
        type: 'template',
        payload
      }
    };
    return this.sendMessage(recipientId, message, options);
  }

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

  sendAction(recipientId, action, options) {
    const recipient = this._createRecipient(recipientId);
    return this.sendRequest({
      recipient,
      sender_action: action
    });
  }

  sendMessage(recipientId, message, options) {
    const recipient = this._createRecipient(recipientId);
    const onDelivery = options && options.onDelivery;
    const onRead = options && options.onRead;
    const req = () => (
      this.sendRequest({
        recipient,
        message
      }).then((json) => {
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

  sendRequest(body, endpoint, method) {
    endpoint = endpoint || 'messages';
    method = method || 'POST';
    return fetch(`https://graph.facebook.com/v2.6/me/${endpoint}?access_token=${this.accessToken}`, {
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

  sendThreadRequest(body, method) {
    console.warning(`
      sendThreadRequest: Dreprecation warning. Thread API has been replaced by the Messenger Profile API.
      Please update your code to use the sendProfileRequest() method instead.`
    );
    return this.sendRequest(body, 'thread_settings', method);
  }

  sendProfileRequest(body, method) {
    return this.sendRequest(body, 'messenger_profile', method);
  }

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

  getUserProfile(userId) {
    const url = `https://graph.facebook.com/v2.6/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.accessToken}`;
    return fetch(url)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`));
  }

  setGreetingText(text) {
    const greeting = (typeof text !== 'string') ? text : [{
      locale: 'default',
      text
    }];
    return this.sendProfileRequest({ greeting });
  }

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

  deleteGetStartedButton() {
    return this.sendProfileRequest({
      fields: [
        'get_started'
      ]
    }, 'DELETE');
  }

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

  deletePersistentMenu() {
    return this.sendProfileRequest({
      fields: [
        'persistent_menu'
      ]
    }, 'DELETE');
  }

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

  hear(keywords, callback) {
    keywords = Array.isArray(keywords) ? keywords : [keywords];
    keywords.forEach(keyword => this._hearMap.push({ keyword, callback }));
    return this;
  }

  module(factory) {
    return factory.apply(this, [this]);
  }

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
