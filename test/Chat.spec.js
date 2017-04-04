'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const BootBot = require('../lib/BootBot');
const Chat = require('../lib/Chat');

describe('Chat', () => {
  let server;
  let userId;
  let bot;
  let chat;

  beforeEach(() => {
    const options = {
      accessToken: '1234',
      verifyToken: '5678',
      appSecret: 'foobar'
    };
    userId = 1234;
    bot = new BootBot(options);
    chat = new Chat(bot, userId);
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  it('creates a chat instance', () => {
    expect(chat instanceof Chat).to.equal(true);
    expect(chat.bot).to.equal(bot);
    expect(chat.userId).to.equal(userId);
  });

  it(`throws an error if it's missing arguments`, () => {
    expect(() => new Chat()).to.throw(Error);
    expect(() => new Chat('Fake Bot')).to.throw(Error);
    expect(() => new Chat(null, 'Fake User ID')).to.throw(Error);
  });

  it('maps say() method to BootBot instance', () => {
    const message = 'hello world';
    const options = { typing: true };
    const spy = sinon.spy(bot, 'say');
    chat.say(message, options);
    expect(spy.calledWith(chat.userId, message, options)).to.equal(true);
  });

  it('maps sendTextMessage() method to BootBot instance', () => {
    const text = 'hello world';
    const quickReplies = [ 'Hi', 'Hello' ];
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendTextMessage');
    chat.sendTextMessage(text, quickReplies, options);
    expect(spy.calledWith(chat.userId, text, quickReplies, options)).to.equal(true);
  });

  it('maps sendButtonTemplate() method to BootBot instance', () => {
    const text = 'hello world';
    const buttons = [ 'Hi', 'Hello' ];
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendButtonTemplate');
    chat.sendButtonTemplate(text, buttons, options);
    expect(spy.calledWith(chat.userId, text, buttons, options)).to.equal(true);
  });

  it('maps sendGenericTemplate() method to BootBot instance', () => {
    const cards = [ 'Card1', 'Card2' ];
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendGenericTemplate');
    chat.sendGenericTemplate(cards, options);
    expect(spy.calledWith(chat.userId, cards, options)).to.equal(true);
  });

  it('maps sendListTemplate() method to BootBot instance', () => {
    const cards = [ 'Card1', 'Card2' ];
    const buttons = [ 'Button 1', 'Button 2' ];
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendListTemplate');
    chat.sendListTemplate(cards, buttons, options);
    expect(spy.calledWith(chat.userId, cards, buttons, options)).to.equal(true);
  });

  it('maps sendTemplate() method to BootBot instance', () => {
    const payload = { type: 'template' };
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendTemplate');
    chat.sendTemplate(payload, options);
    expect(spy.calledWith(chat.userId, payload, options)).to.equal(true);
  });

  it('maps sendAttachment() method to BootBot instance', () => {
    const type = 'video';
    const url = 'google.com';
    const quickReplies = [ 'Hi', 'Hello' ];
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendAttachment');
    chat.sendAttachment(type, url, quickReplies, options);
    expect(spy.calledWith(chat.userId, type, url, quickReplies, options)).to.equal(true);
  });

  it('maps sendAction() method to BootBot instance', () => {
    const action = 'typing_on';
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendAction');
    chat.sendAction(action, options);
    expect(spy.calledWith(chat.userId, action, options)).to.equal(true);
  });

  it('maps sendMessage() method to BootBot instance', () => {
    const message = { type: 'template' };
    const options = { typing: true };
    const spy = sinon.spy(bot, 'sendMessage');
    chat.sendMessage(message, options);
    expect(spy.calledWith(chat.userId, message, options)).to.equal(true);
  });

  it('maps sendRequest() method to BootBot instance', () => {
    const body = { recipient: { id: chat.userId }, message: { text: 'Hello' } };
    const endpoint = 'messages';
    const method = 'POST';
    const spy = sinon.spy(bot, 'sendRequest');
    chat.sendRequest(body, endpoint, method);
    expect(spy.calledWith(body, endpoint, method)).to.equal(true);
  });

  it('maps sendTypingIndicator() method to BootBot instance', () => {
    const milliseconds = 2000;
    const spy = sinon.spy(bot, 'sendTypingIndicator');
    chat.sendTypingIndicator(milliseconds);
    expect(spy.calledWith(chat.userId, milliseconds)).to.equal(true);
  });

  it('maps getUserProfile() method to BootBot instance', () => {
    const spy = sinon.spy(bot, 'getUserProfile');
    chat.getUserProfile();
    expect(spy.calledWith(chat.userId)).to.equal(true);
  });

  it('maps conversation() method to BootBot instance', () => {
    const factory = () => {};
    const spy = sinon.spy(bot, 'conversation');
    chat.conversation(factory);
    expect(spy.calledWith(chat.userId, factory)).to.equal(true);
  });
});
