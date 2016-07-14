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
        "title":"Welcome to Peter\'s Hats",
        "image_url":"http://petersapparel.parseapp.com/img/item100-thumb.png",
        "subtitle":"We\'ve got the right hat for everyone.",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://petersapparel.parseapp.com/view_item?item_id=100",
            "title":"View Website"
          },
          {
            "type":"postback",
            "title":"Start Chatting",
            "payload":"USER_DEFINED_PAYLOAD"
          }
        ]
      }
    ];
    const expected = {
      recipient: {
        id: userId
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements
          }
        }
      }
    };

    bot.sendGenericTemplate(userId, elements);
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
});
