'use strict';
module.exports = (bot) => {
  bot.hear('help', (payload, data) => {
    const text = payload.message.text;
    const senderId = payload.sender.id;
    const buttons = [
      { type: 'postback', title: 'Settings', payload: 'HELP_SETTINGS' },
      { type: 'postback', title: 'Notifications', payload: 'HELP_NOTIFICATIONS' }
    ];
    bot.sendButtonTemplate(`Need help? Try one of these options`, buttons, senderId);
  });
};
