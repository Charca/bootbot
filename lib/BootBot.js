'use strict';
const Chat = require('./Chat');
const Conversation = require('./Conversation');
const EventEmitter = require('eventemitter3');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');

class BootBot extends EventEmitter {
  constructor(options) {
    super();
    if (!options || (options && (!options.accessToken || !options.verifyToken || !options.appSecret))) {
      throw new Error('You need to specify an accessToken, verifyToken and appSecret');
    }
    this.accessToken = options.accessToken;
    this.verifyToken = options.verifyToken;
    this.appSecret = options.appSecret;
    this.app = express();
    this.app.use(bodyParser.json({ verify: this._verifyRequestSignature.bind(this) }));
    this._hearMap = [];
    this._conversations = [];
    this._initWebhook();
  }

  start(port) {
    this.app.set('port', port || 3000);
    this.server = this.app.listen(this.app.get('port'), () => {
      console.log('BootBot running on port', this.app.get('port'));
    });
  }

  close() {
    this.server.close();
  }

  sendTextMessage(recipientId, text, options) {
    return this.sendMessage(recipientId, { text }, options);
  }

  sendButtonTemplate(recipientId, text, buttons, options) {
    const payload = {
      template_type: 'button',
      text,
      buttons
    };
    return this.sendTemplate(recipientId, payload, options);
  }

  sendGenericTemplate(recipientId, elements, options) {
    const payload = {
      template_type: 'generic',
      elements
    };
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

  sendAttachment(recipientId, type, url, options) {
    const message = {
      attachment: {
        type,
        payload: { url }
      }
    };
    return this.sendMessage(recipientId, message, options);
  }

  sendAction(recipientId, action, options) {
    return this.sendRequest({
      recipient: {
        id: recipientId
      },
      sender_action: action
    }, options);
  }

  sendMessage(recipientId, message, options) {
    const req = () => (
      this.sendRequest({
        recipient: {
          id: recipientId
        },
        message
      }, options)
    );
    if (options && options.typing) {
      const autoTimeout = (message && message.text) ? message.text.length * 10 : 1000;
      const timeout = (typeof options.typing === 'number') ? options.typing : autoTimeout;
      return this.sendTypingIndicator(recipientId, timeout).then(req);
    }
    return req();
  }

  sendRequest(body, options) {
    return fetch(`https://graph.facebook.com/v2.6/me/messages?access_token=${this.accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .catch(err => console.log(`Error sending message: ${err}`));
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

  say(recipientId, text, options) {
    return this.sendTextMessage(recipientId, text, options);
  }

  hear(keywords, callback) {
    keywords = Array.isArray(keywords) ? keywords : [ keywords ];
    keywords.forEach(keyword => this._hearMap.push({ keyword, callback }));
    return this;
  }

  module(factory) {
    return factory.apply(this, [ this ]);
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
    factory.apply(this, [ convo ]);
    return convo;
  }

  _handleEvent(type, event, data) {
    const chat = new Chat(this, event.sender.id);
    this.emit(type, event, chat, data);
  }

  _handleMessageEvent(event) {
    if (this._handleConversationResponse('message', event)) { return; }
    const text = event.message.text;
    const senderId = event.sender.id;
    let captured = false;
    if (!text) { return; }

    this._hearMap.forEach(hear => {
      if (hear.keyword.toLowerCase() === text.toLowerCase()) {
        captured = true;
        return hear.callback.apply(this, [event, new Chat(this, senderId), {
          keyword: hear.keyword
        }]);
      } else if (hear.keyword instanceof RegExp && hear.keyword.test(text)) {
        captured = true;
        return hear.callback.apply(this, [event, new Chat(this, senderId), {
          keyword: hear.keyword,
          match: text.match(hear.keyword)
        }]);
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
    this._handleEvent('postback', event);
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

  _initWebhook() {
    this.app.get('/webhook', (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.verifyToken) {
        console.log('Validation Succeded.')
        res.status(200).send(req.query['hub.challenge']);
      } else {
        console.error('Failed validation. Make sure the validation tokens match.');
        res.sendStatus(403);
      }
    });

    this.app.post('/webhook', (req, res) => {
      var data = req.body;
      if (data.object !== 'page') {
        return;
      }

      // Iterate over each entry. There may be multiple if batched.
      data.entry.forEach((entry) => {
          // Iterate over each messaging event
          entry.messaging.forEach((event) => {
            if (event.optin) {
              this._handleEvent('authentication', event);
            } else if (event.message && event.message.text) {
              this._handleMessageEvent(event);
            } else if (event.message && event.message.attachments) {
              this._handleAttachmentEvent(event);
            } else if (event.postback) {
              this._handlePostbackEvent(event);
            } else if (event.delivery) {
              this._handleEvent('delivery', event);
            } else if (event.read) {
              this._handleEvent('read', event);
            } else {
              console.log('Webhook received unknown event: ', event);
            }
          });
        });

        // Must send back a 200 within 20 seconds or the request will time out.
        res.sendStatus(200);
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
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }
}

module.exports = BootBot;
