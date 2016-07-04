'use strict';
module.exports = (bot) => {
  bot.on('message', (payload, data) => {
    const text = payload.message.text;
    const senderId = payload.sender.id;

    if (data.captured) { return; }
    bot.sendTextMessage(`Echo: ${text}`, senderId);
  });
};
