'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const BootBot = require('../lib/BootBot');
const Conversation = require('../lib/Conversation');

describe('Conversation', () => {
  let server;
  let userId;
  let bot;
  let convo;

  beforeEach(() => {
    const options = {
      accessToken: '1234',
      verifyToken: '5678',
      appSecret: 'foobar'
    };
    userId = 1234;
    bot = new BootBot(options);
    convo = new Conversation(bot, userId);
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  it('creates a conversation instance', () => {
    expect(convo instanceof Conversation).to.equal(true);
    expect(convo.bot).to.equal(bot);
    expect(convo.userId).to.equal(userId);
  });

  it(`throws an error if it's missing arguments`, () => {
    expect(() => new Conversation()).to.throw(Error);
    expect(() => new Conversation('Fake Bot')).to.throw(Error);
    expect(() => new Conversation(null, 'Fake User ID')).to.throw(Error);
  });

  it('starts the conversation by default', () => {
    expect(convo.isActive()).to.equal(true);
  });

  it('asks a question using a function', () => {
    const question = sinon.spy();
    convo.ask(question, () => {});
    expect(question.calledOnce).to.equal(true);
  });

  it('asks a question with .say() using a string or an object', () => {
    const questionStr = `What's your name?`;
    const questionObj = { text: `What's your name?`, buttons: ['Foo', 'Bar'] };
    const spy = sinon.spy(bot, 'say');
    convo.ask(questionStr, () => {});
    expect(spy.calledWith(convo.userId, questionStr)).to.equal(true);
    convo.ask(questionObj, () => {});
    expect(spy.calledWith(convo.userId, questionObj)).to.equal(true);
  });

  it('responds to a question using the answer callback', () => {
    const answer = sinon.spy();
    const payload = { message: { text: 'My name is Maxi' } };
    const data = { type: 'message' };
    convo.ask(`What's your name?`, answer);
    convo.respond(payload, data);
    expect(answer.calledWith(payload, convo, data)).to.equal(true);
  });

  it(`ignores an answer if the question hasn't been asked yet`, () => {
    const answer = sinon.spy();
    const payload = { message: { text: 'My name is Maxi' } };
    const data = { type: 'message' };
    const response = convo.respond(payload, data);
    expect(response).to.equal(undefined);
    expect(convo.isActive()).to.equal(true);
    expect(convo.isWaitingForAnswer()).to.equal(false);
    convo.ask(`What's your name?`, answer);
    expect(convo.isWaitingForAnswer()).to.equal(true);
    convo.respond(payload, data);
    expect(answer.calledWith(payload, convo, data)).to.equal(true);
  });

  it('responds to a message using the callback array', () => {
    const question = {
      text: `What's your favorite color?`,
      buttons: [
        { type: 'postback', title: 'Red', payload: 'COLOR_RED' },
        { type: 'postback', title: 'Green', payload: 'COLOR_GREEN' },
        { type: 'postback', title: 'Blue', payload: 'COLOR_BLUE' }
      ]
    };
    const answer = sinon.spy();
    const buttonCallback = sinon.spy();
    const redButtonCallback = sinon.spy();
    const callbacks = [
      {
        event: 'postback',
        callback: buttonCallback
      },
      {
        event: 'postback:COLOR_RED',
        callback: redButtonCallback
      }
    ];

    convo.ask(question, answer, callbacks);
    convo.respond({ postback: { payload: 'COLOR_RED' } }, { type: 'postback' });
    expect(answer.called).to.equal(false);
    expect(buttonCallback.called).to.equal(false);
    expect(redButtonCallback.calledOnce).to.equal(true);

    answer.reset();
    buttonCallback.reset();
    redButtonCallback.reset();

    convo.ask(question, answer, callbacks);
    convo.respond({ postback: { payload: 'COLOR_GREEN' } }, { type: 'postback' });
    expect(answer.called).to.equal(false);
    expect(buttonCallback.calledOnce).to.equal(true);
    expect(redButtonCallback.called).to.equal(false);

    answer.reset();
    buttonCallback.reset();
    redButtonCallback.reset();

    convo.ask(question, answer, callbacks);
    convo.respond({ message: { text: 'Purple' } }, { type: 'message' });
    expect(answer.calledOnce).to.equal(true);
    expect(buttonCallback.called).to.equal(false);
    expect(redButtonCallback.called).to.equal(false);
  });

  it('emits a start event on .start() and set the convo to active', () => {
    const callback = sinon.spy();
    convo.on('start', callback);
    convo.start();
    expect(callback.calledOnce).to.equal(true);
    expect(convo.isActive()).to.equal(true);
  });

  it('emits an end event on .end() and set the convo to inactive', () => {
    const callback = sinon.spy();
    convo.on('end', callback);
    convo.end();
    expect(callback.calledOnce).to.equal(true);
    expect(convo.isActive()).to.equal(false);
  });

  it('saves a value in the conversation context', () => {
    convo.set('name', 'Maxi');
    convo.set('food', 'Pizza');
    convo.set('age', 27);

    expect(convo.get('name')).to.equal('Maxi');
    expect(convo.get('food')).to.equal('Pizza');
    expect(convo.get('age')).to.equal(27);
  });
});
