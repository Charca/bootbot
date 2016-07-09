'use strict';
const BootBot = require('../');
const config = require('config');
const echoModule = require('./modules/echo');

const bot = new BootBot({
  accessToken: config.get('access_token'),
  verifyToken: config.get('verify_token'),
  appSecret: config.get('app_secret')
});

bot.module(echoModule);

const askName = (convo) => {
  convo.ask(`Hello! What's your name?`, (payload, convo, data) => {
    const text = payload.message.text;
    convo.set('name', text);
    convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
  });
};

const askFavoriteFood = (convo) => {
  convo.ask(`What's your favorite food?`, (payload, convo, data) => {
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
  }, (payload, convo, data) => {
    const text = payload.message.text;
    convo.set('gender', text);
    convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
  }, [
    {
      event: 'postback',
      callback: (payload, convo) => {
        convo.say('You clicked on a button').then(() => askAge(convo));
      }
    },
    {
      event: 'postback:GENDER_MALE',
      callback: (payload, convo) => {
        convo.say('You said you are a Male').then(() => askAge(convo));
      }
    },
    {
      event: 'quick_reply',
      callback: () => {}
    },
    {
      event: 'quick_reply:COLOR_BLUE',
      callback: () => {}
    },
    {
      pattern: ['yes', /yea(h)?/i, 'yup'],
      callback: () => {
        convo.say('You said YES!').then(() => askAge(convo));
      }
    }
  ]);
};

const askAge = (convo) => {
  convo.ask(`Final question. How old are you?`, (payload, convo, data) => {
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

bot.hear('hello', (payload, chat) => {
  chat.conversation((convo) => {
    convo.sendTypingIndicator(1000).then(() => askName(convo));
  });
});

bot.hear('hey', (payload, chat) => {
  chat.say('Hello friend', { typing: true }).then(() => (
    chat.say('So, I’m good at talking about the weather. Other stuff, not so good. If you need help just enter “help.”', { typing: true })
  ));
});

bot.hear('color', (payload, chat) => {
  chat.say({
    text: 'Favorite color?',
    quickReplies: [ 'Red', 'Blue', 'Green' ]
  });
});

bot.hear('image', (payload, chat) => {
  chat.say({
    attachment: 'image',
    url: 'http://static3.gamespot.com/uploads/screen_medium/1365/13658182/3067965-overwatch-review-promo-20160523_v2.jpg',
    quickReplies: [ 'Red', 'Blue', 'Green' ]
  });
});

bot.hear('button', (payload, chat) => {
  chat.say({
    text: 'Select a button',
    buttons: [ 'Male', 'Female', `Don't wanna say` ]
  });
});

bot.hear('convo', (payload, chat) => {
  chat.conversation(convo => {
    convo.ask({
      text: 'Favorite color?',
      quickReplies: [ 'Red', 'Blue', 'Green' ]
    }, (payload, convo) => {
      const text = payload.message.text;
      convo.say(`Oh your favorite color is ${text}, cool!`);
      convo.end();
    }, [
      {
        event: 'quick_reply',
        callback: (payload, convo) => {
          const text = payload.message.text;
          convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
          convo.end();
        }
      }
    ]);
  });
});

bot.start();
