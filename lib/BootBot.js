'use strict';
const Conversation = require('./Conversation');
const EventEmitter = require('eventemitter3');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');

class BootBot extends EventEmitter {
  constructor(options) {
    super();
    if (!options || (options && (!options.access_token || !options.verify_token || !options.app_secret))) {
      throw new Error('You need to specify an access_token, verify_token and app_secret');
    }
    this.access_token = options.access_token;
    this.verify_token = options.verify_token;
    this.app_secret = options.app_secret;
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

  sendTextMessage(text, recipientId) {
    return this.sendMessage({ text }, recipientId);
  }

  sendButtonMessage(text, buttons, recipientId) {
    const message = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'button',
          'text': text,
          'buttons': buttons
        }
      }
    };
    return this.sendMessage(message, recipientId);
  }

  sendGenericTemplate(cards, recipientId) {
    const message = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': cards
        }
      }
    };
    return this.sendMessage(message, recipientId);
  }

  sendMessage(message, recipientId) {
    return fetch(`https://graph.facebook.com/v2.6/me/messages?access_token=${this.access_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message
      })
    })
    .then(res => res.json())
    .catch(err => console.log(`Error sending message: ${err}`));
  }

  say(text, recipientId) {
    return this.sendTextMessage(text, recipientId);
  }

  hear(keywords, callback) {
    keywords = Array.isArray(keywords) ? keywords : [ keywords ];
    keywords.forEach(keyword => this._hearMap.push({ keyword, callback }));
    return this;
  }

  module(factory) {
    return factory(this);
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
    this.emit(type, event, data);
  }

  _handleMessageEvent(event) {
    if (this._handleConversationResponse(event)) { return; }
    const text = event.message.text;
    let captured = false;
    if (!text) { return; }

    this._hearMap.forEach(hear => {
      if (hear.keyword.toLowerCase() === text.toLowerCase()) {
        captured = true;
        return hear.callback.apply(this, [event, {
          keyword: hear.keyword
        }]);
      } else if (hear.keyword instanceof RegExp && hear.keyword.test(text)) {
        captured = true;
        return hear.callback.apply(this, [event, {
          keyword: hear.keyword,
          match: text.match(hear.keyword)
        }]);
      }
    });

    this._handleEvent('message', event, { captured });
  }

  _handleAttachmentEvent(event) {
    if (this._handleConversationResponse(event)) { return; }
    this._handleEvent('attachment', event);
  }

  _handlePostbackEvent(event) {
    if (this._handleConversationResponse(event)) { return; }
    this._handleEvent('postback', event);
  }

  _handleConversationResponse(event) {
    const userId = event.sender.id;
    let captured = false;
    this._conversations.forEach(convo => {
      if (userId && userId === convo.userId && convo.isActive()) {
        captured = true;
        return convo.respond(event, {});
      }
    });
    return captured;
  }

  _initWebhook() {
    this.app.get('/webhook', (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.verify_token) {
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
      var expectedHash = crypto.createHmac('sha1', this.app_secret)
                          .update(buf)
                          .digest('hex');

      if (signatureHash != expectedHash) {
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }
}

module.exports = BootBot;
