'use strict';
module.exports = (bot) => {
  bot.on('message', (payload, chat, data) => {
    const text = payload.message.text;
    if (data.captured) { return; }
    chat.say(`Echo: ${text}`);
  });
};
