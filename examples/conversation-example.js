'use strict';
const BootBot = require('../');
const config = require('config');
const echoModule = require('./modules/echo');

const bot = new BootBot({
  access_token: config.get('access_token'),
  verify_token: config.get('verify_token'),
  app_secret: config.get('app_secret')
});

bot.module(echoModule);

const askName = (convo) => {
  convo.ask(`Hello! What's your name?`, (payload, data, convo) => {
    const text = payload.message.text;
    convo.set('name', text);
    convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
  });
};

const askFavoriteFood = (convo) => {
  convo.ask(`What's your favorite food?`, (payload, data, convo) => {
    const text = payload.message.text;
    convo.set('food', text);
    convo.say(`Got it, your favorite food is ${text}`).then(() => askGender(convo));
  });
};

const askGender = (convo) => {
  convo.ask((convo) => {
    const buttons = [
      { type: 'postback', title: 'Male', payload: 'GENDER_MALE' },
      { type: 'postback', title: 'Female', payload: 'GENDER_FEMALE' },
      { type: 'postback', title: 'I don\'t wanna say', payload: 'GENDER_UNKNOWN' }
    ];
    convo.sendButtonTemplate(`Are you a boy or a girl?`, buttons);
  }, (payload, data, convo) => {
    const text = payload.message.text;
    convo.set('gender', text);
    convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
  });
};

const askAge = (convo) => {
  convo.ask(`Final question. How old are you?`, (payload, data, convo) => {
    const text = payload.message.text;
    convo.set('age', text);
    convo.say(`That's great!`).then(() => {
      convo.say(`Ok, here's what you told me about you:
      - Name: ${convo.get('name')}
      - Favorite Food: ${convo.get('food')}
      - Gender: ${convo.get('gender')}
      - Age: ${convo.get('age')}
      `);
      convo.end();
    });
  });
};

bot.hear('hello', (payload, data) => {
  const text = payload.message.text;
  const senderId = payload.sender.id;

  bot.conversation(senderId, (convo) => {
    bot.sendTypingIndicator(1000, senderId).then(() => askName(convo));
  });
});

bot.start();
