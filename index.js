'use strict';
const EventEmitter = require('eventemitter3');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');

class BootBot extends EventEmitter {
  constructor(options) {
    super();
    this.access_token = options.access_token;
    this.verify_token = options.verify_token;
    this.app_secret = options.app_secret;
    this.app = express();
    this.app.use(bodyParser.json({ verify: this._verifyRequestSignature.bind(this) }));
    this._hearMap = [];
    this._initWebhook();
  }

  start(port) {
    this.app.set('port', port || 3000);
    this.app.listen(this.app.get('port'), () => {
      console.log('BootBot running on port', this.app.get('port'));
    });
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

  hear(keywords, callback) {
    keywords = Array.isArray(keywords) ? keywords : [ keywords ];
    keywords.forEach(keyword => this._hearMap.push({ keyword, callback }));
  }

  _handleEvent(type, event) {
    this.emit(type, event);
  }

  _handleMessageEvent(event) {
    const text = event.message.text;
    if (!text) {
      return;
    }

    this._hearMap.forEach(hear => {
      if (hear.keyword === text || (hear.keyword instanceof RegExp && hear.keyword.test(text))) {
        return hear.callback.apply(this, [ event ]);
      }
    });

    this._handleEvent('message', event);
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
              this._handleEvent('attachment', event);
            } else if (event.postback) {
              this._handleEvent('postback', event);
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
