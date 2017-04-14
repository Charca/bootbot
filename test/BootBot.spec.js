'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const BootBot = require('../lib/BootBot');

describe('BootBot', () => {
  let server;
  let userId;
  let bot;

  beforeEach(() => {
    const options = {
      accessToken: '1234',
      verifyToken: '5678',
      appSecret: 'foobar'
    };
    userId = 1234;
    bot = new BootBot(options);
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  it('creates a bot instance', () => {
    expect(bot instanceof BootBot).to.equal(true);
  });

  it('throws an error if there are missing tokens', () => {
    expect(() => new BootBot()).to.throw(Error);
  });

  it('can send a text message', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const text = 'Hello world!';
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        text
      }
    };

    bot.sendTextMessage(userId, text);
    expect(spy.calledWith(expected)).to.equal(true);
  });

  it('can send a text message with quick replies', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const text = 'Hello world!';

    // Quick Replies as strings with auto-generated payload
    const quickReplies1 = ['Red', 'Green', 'Blue'];
    const expected1 = {
      recipient: {
        id: userId
      },
      message: {
        text,
        quick_replies: [{
          content_type: 'text',
          title: 'Red',
          payload: 'BOOTBOT_QR_RED'
        }, {
          content_type: 'text',
          title: 'Green',
          payload: 'BOOTBOT_QR_GREEN'
        }, {
          content_type: 'text',
          title: 'Blue',
          payload: 'BOOTBOT_QR_BLUE'
        }]
      }
    };

    bot.sendTextMessage(userId, text, quickReplies1);
    expect(spy.calledWith(expected1)).to.equal(true);

    // Quick Replies as objects with partial information
    const quickReplies2 = [{
      title: 'Purple'
    }, {
      title: 'Yellow',
      payload: 'CUSTOM_YELLOW'
    }, {
      title: 'Image',
      image_url: 'http://google.com/image.png'
    }];
    const expected2 = {
      recipient: {
        id: userId
      },
      message: {
        text,
        quick_replies: [{
          content_type: 'text',
          title: 'Purple',
          payload: 'BOOTBOT_QR_PURPLE'
        }, {
          content_type: 'text',
          title: 'Yellow',
          payload: 'CUSTOM_YELLOW'
        }, {
          content_type: 'text',
          title: 'Image',
          payload: 'BOOTBOT_QR_IMAGE',
          image_url: 'http://google.com/image.png'
        }]
      }
    };

    bot.sendTextMessage(userId, text, quickReplies2);
    expect(spy.calledWith(expected2)).to.equal(true);

    // Quick Replies as custom object
    const quickReplies3 = [{
      content_type: 'location'
    }, {
      content_type: 'bootbot',
      payload: 'THIS_IS_JUST_A_TEST'
    }, {
      foo: 'bar'
    }];
    const expected3 = {
      recipient: {
        id: userId
      },
      message: {
        text,
        quick_replies: [{
          content_type: 'location'
        }, {
          content_type: 'bootbot',
          payload: 'THIS_IS_JUST_A_TEST'
        }, {
          foo: 'bar'
        }]
      }
    };

    bot.sendTextMessage(userId, text, quickReplies3);
    expect(spy.calledWith(expected3)).to.equal(true);
  });

  it('can send a button template', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const text = 'Choose an option';
    const buttons = [
      { type: 'postback', title: 'Red', payload: 'COLOR_RED' },
      { type: 'postback', title: 'Green', payload: 'COLOR_GREEN' },
      { type: 'postback', title: 'Blue', payload: 'COLOR_BLUE' }
    ];
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons
          }
        }
      }
    };

    bot.sendButtonTemplate(userId, text, buttons);
    expect(spy.calledWith(expected)).to.equal(true);
  });

  it('can send a generic template', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const elements = [
      {
        "title": "Welcome to Peter\'s Hats",
        "image_url": "http://petersapparel.parseapp.com/img/item100-thumb.png",
        "subtitle": "We\'ve got the right hat for everyone.",
        "buttons": [
          {
            "type": "web_url",
            "url": "https://petersapparel.parseapp.com/view_item?item_id=100",
            "title": "View Website"
          },
          {
            "type": "postback",
            "title": "Start Chatting",
            "payload": "USER_DEFINED_PAYLOAD"
          }
        ]
      }
    ];
    const options = {
      imageAspectRatio: 'horizontal'
    };
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            image_aspect_ratio: 'horizontal',
            elements
          }
        }
      }
    };

    bot.sendGenericTemplate(userId, elements, options);
    expect(spy.calledWith(expected)).to.equal(true);
  });

  it('can send a list template', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const elements = [{
      "title": "Classic T-Shirt Collection",
      "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
      "subtitle": "See all our colors",
      "default_action": {
        "type": "web_url",
        "url": "https://peterssendreceiveapp.ngrok.io/shop_collection",
        "messenger_extensions": true,
        "webview_height_ratio": "tall",
        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
      },
      "buttons": [{
        "title": "View",
        "type": "web_url",
        "url": "https://peterssendreceiveapp.ngrok.io/collection",
        "messenger_extensions": true,
        "webview_height_ratio": "tall",
        "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
      }]
    }];
    const buttons = [{
      "title": "View More",
      "type": "postback",
      "payload": "payload"
    }]
    const options = {
      topElementStyle: 'compact'
    };
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'list',
            top_element_style: 'compact',
            elements,
            buttons
          }
        }
      }
    };

    bot.sendListTemplate(userId, elements, buttons, options);
    expect(spy.calledWith(expected)).to.equal(true);
  });

  it('can send an attachment', () => {
    const spy = sinon.spy(bot, 'sendRequest');
    const type = 'image';
    const url = 'http://petersapparel.parseapp.com/img/item100-thumb.png';
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        attachment: {
          type,
          payload: {
            url
          }
        }
      }
    };

    bot.sendAttachment(userId, type, url);
    expect(spy.calledWith(expected)).to.equal(true);
  });

  it('emits a referral event', () => {
    const callback = sinon.spy();
    const event = {
      "sender": {
        "id": "USER_ID"
      },
      "recipient": {
        "id": "PAGE_ID"
      },
      "timestamp": 1458692752478,
      "referral": {
        "ref": "MY_REF",
        "source": "SHORTLINK",
        "type": "OPEN_THREAD"
      }
    };
    bot.on('referral', callback);
    bot._handleEvent('referral', event);
    expect(callback.calledWith(event)).to.equal(true);
  });

  describe('Messenger Profile API', () => {
    it('can set a greeting text', () => {
      const spy = sinon.spy(bot, 'sendProfileRequest');
      const text = 'Hello, world!';
      const expected = {
        greeting: [{
          locale: 'default',
          text
        }]
      };

      bot.setGreetingText(text);
      expect(spy.calledWith(expected)).to.equal(true);
    });

    it('can set the Get Started button', () => {
      const spy = sinon.spy(bot, 'sendProfileRequest');
      const callback = () => {};
      const expected = {
        get_started: {
          payload: 'BOOTBOT_GET_STARTED'
        }
      };

      // With a callback
      bot.setGetStartedButton(callback);
      expect(spy.calledWith(expected)).to.equal(true);

      const payload = 'CUSTOM_GET_STARTED_PAYLOAD';
      const expected2 = {
        get_started: {
          payload
        }
      };

      // With a payload
      bot.setGetStartedButton(payload);
      expect(spy.calledWith(expected)).to.equal(true);
    });

    it('can delete the Get Started button', () => {
      const spy = sinon.spy(bot, 'sendProfileRequest');
      const expected = {
        fields: [ 'get_started' ]
      };

      bot.deleteGetStartedButton();
      expect(spy.calledWith(expected, 'DELETE')).to.equal(true);
    });

    it('can set the Persistent Menu', () => {
      const spy = sinon.spy(bot, 'sendProfileRequest');
      const buttons = [
        {
          title: 'My Account',
          type: 'nested',
          call_to_actions: [
            {
              title: 'Pay Bill',
              type: 'postback',
              payload: 'PAYBILL_PAYLOAD'
            },
            {
              title: 'History',
              type: 'postback',
              payload: 'HISTORY_PAYLOAD'
            },
            {
              title: 'Contact Info',
              type: 'postback',
              payload: 'CONTACT_INFO_PAYLOAD'
            }
          ]
        },
        {
          title: 'Go to Website',
          type: 'web_url',
          url: 'http://purple.com'
        }
      ];
      const disableInput = false;
      const expected = {
        persistent_menu: [{
          locale: 'default',
          composer_input_disabled: disableInput,
          call_to_actions: buttons
        }]
      };

      bot.setPersistentMenu(buttons, disableInput);
      expect(spy.calledWith(expected)).to.equal(true);
    });

    it('can delete the Persistent Menu', () => {
      const spy = sinon.spy(bot, 'sendProfileRequest');
      const expected = {
        fields: [ 'persistent_menu' ]
      };

      bot.deletePersistentMenu();
      expect(spy.calledWith(expected, 'DELETE')).to.equal(true);
    });
  });

  describe('Checkbox Plugin support', () => {
    it('uses the user_ref param as the recipient when replying to a checkbox authentication event', () => {
      const spy = sinon.spy(bot, 'sendMessage');
      const event = {
        "recipient": {
          "id": "PAGE_ID"
        },
        "timestamp": 1234567890,
        "optin": {
          "ref": "PASS_THROUGH_PARAM",
          "user_ref": "UNIQUE_REF_PARAM"
        }
      };
      const expectedRecipient = { user_ref: 'UNIQUE_REF_PARAM' };
      const expectedMessage = { text: 'hello' };

      bot.on('authentication', (payload, chat) => {
        chat.say('hello');
      });
      bot._handleEvent('authentication', event);
      expect(spy.calledWith(expectedRecipient, expectedMessage)).to.equal(true);
    });

    it('uses the sender ID if the authentication event contains one', () => {
      const spy = sinon.spy(bot, 'sendMessage');
      const event = {
        "sender": {
          "id": "USER_ID"
        },
        "recipient": {
          "id": "PAGE_ID"
        },
        "timestamp": 1234567890,
        "optin": {
          "ref":"PASS_THROUGH_PARAM"
        }
      };
      const expectedRecipient = 'USER_ID';
      const expectedMessage = { text: 'hello' };

      bot.on('authentication', (payload, chat) => {
        chat.say('hello');
      });
      bot._handleEvent('authentication', event);
      expect(spy.calledWith(expectedRecipient, expectedMessage)).to.equal(true);
    });
  });
});
