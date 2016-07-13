<p align="center">
	<img src="./assets/logo.png" />
</p>

BootBot is a simple but powerful JavaScript Framework to build Facebook Messenger's Chat bots.

| [Features][] | [Usage][] | [Video Overview][] | [Documentation][] | [Examples][] | [Credits][] | [License][] |
|---|---|---|---|---|---|---|

## Features

- Helper methods to **send** any type of message supported by Facebook.
- **Subscribe** to a particular type of message, or to certain **keywords** sent by the user.
- Start **conversations**, **ask** questions and save important information in the **context** of the conversation.
- Organize your code in **modules**.
- Send automatic or manual **typing indicators**.
- Set threads such as a **persistent menu**, a **greeting text** or a **get started CTA**.
- Subscribe to **received** and **read** events.

## Usage

```
$ npm install bootbot --save
```

```javascript
'use strict';
const BootBot = require('../');

const bot = new BootBot({
  accessToken: 'FB_ACCESS_TOKEN',
  verifyToken: 'FB_VERIFY_TOKEN',
  appSecret: 'FB_APP_SECRET'
});

bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  chat.say(`Echo: ${text}`);
});

bot.start();
```

## Video Overwview

![IMG]()

## Documentation

### BootBot Class

#### `new BootBot(options)`

| `options` key | Type | Default | Required |
|:--------------|:-----|:--------|:---------|
| `accessToken` | string | | `Y` |
| `verifyToken` | string | | `Y` |
| `appSecret` | string | | `Y` |
| `broadcastEchoes` | boolean | `false` | `N` |

Creates a new `BootBot` instance. Instantiates the new express app and all required webhooks. `options` param must contain all tokens and app secret of your Facebook app. Optionally, set `broadcastEchoes` to `true` if you want the messages your bot send to be echoed back to it (you probably don't need this feature unless you have multiple bots running on the same Facebook page).

#### `.start([ port ])`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `port` | number | `3000` | `N` |

Starts the express server on the specified port. Defaults port to 3000.

#### `.close()`

Closes the express server (calls `.close()` on the server instance).

### Receive API

Use these methods to subscribe your bot to messages, attachments or anything the user might send.

#### `.on(event, callback)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `event` | string | | `Y` |
| `callback` | function | | `Y` |

Subscribe to an event emitted by the bot, and execute a callback when those events are emitted. Available events are:

| Event | Description |
|:------|:-----|
| `message` | The bot received a text message from the user |
| `quick_reply` | The bot received a quick reply from the user (quick replies emit both `message` and `quick_reply` events) |
| `attachment` | The bot received an attachment from the user |
| `postback` | The bot received a postback call from the user (usually means the user clicked a button) |
| `delivery` | The bot received a confirmation that your message was delivered to the user |
| `read` | The bot received a confirmation that your message was read by the user |
| `authentication` | A user has started a conversation with the bot using a "Send to Messenger" button |

You can also subscribe to specific postbacks and quick replies by using a namespace. For example `postback:ADD_TO_CART` subscribes only to the postback event containing the `ADD_TO_CART` payload.

If you want to subscribe to specific keywords on a `message` event, see the `.hear()` method below.

When these events ocurr, the specified callback will be invoked with 3 params: `(payload, chat, data)`

| Param | Description |
|:------|:-----|
| `payload` | The data sent by the user (contains the text of the message, the attachment, etc.) |
| `chat` | A `Chat` instance that you can use to reply to the user. Contains all the methods defined in the [Send API](#send-api) |
| `data` | Contains extra data provided by the framework, like a `captured` flag that signals if this message was already captured by a different callback |

##### Examples:

```javascript
bot.on('message', (payload, chat) => {
	console.log('A text message was received!');
});

bot.on('attachment', (payload, chat) => {
	console.log('An attachment was received!');
});

bot.on('postback:HELP_ME', (payload, chat) => {
	console.log('The Help Me button was clicked!');
});

bot.on('message', (payload, chat) => {
	// Reply to the user
	chat.say('Hey, user. I got your message!');
});
```

#### `.hear(keywords, callback)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `keywords` | string, regex or mixed array | | `Y` |
| `callback` | function | | `Y` |

A convinient method to subscribe to `message` events containing specific keywords. The `keyword` param can be a string, a regex or an array of both strings and regexs that will be tested against the received message. If the bot receives a message that matches any of the keywords, it will execute the specified `callback`. String keywords are case-insensitive, but regular expressions are not case-insensitive by default, if you want them to be, specify the `i` flag.

The callback's signature is identical to that of the `.on()` method above.

##### Examples:

```javascript
bot.hear('hello', (payload, chat) => {
	chat.say('Hello, human!');
});

bot.hear(['hello', 'hi', 'hey'], (payload, chat) => {
	chat.say('Hello, human!');
});

bot.hear([/(good)?bye/i, /see (ya|you)/i, 'adios'], (payload, chat) => {
	// Matches: goodbye, bye, see ya, see you, adios
	chat.say('Bye, human!');
});
```

**Note** that if a bot is subscribed to both the `message` event using the `.on()` method and a specific keyword using the `.hear()` method, the event will be emitted to both of those subscriptions. If you want to know if a message event was already captured by a different subsciption, you can check for the `data.captured` flag on the callback.

### Send API

BootBot provides helper methods for every type of message supported by Facebook's Messenger API. It also provides a generic `sendMessage` method that you can use to send a custom payload.

#### Important Note:
The Send API methods are shared between the `BootBot`, `Chat` and `Conversation` instances, the only difference is that when you use any of these methods from the `Chat` or `Conversation` instances, you don't have to specify the `userId`.

Example - These two methods are identical:

```javascript
bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  const userId = payload.sender.id;
  bot.say(userId, 'Hello World');
});

// is the same as...

bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  chat.say('Hello World');
});
```

You'll likely use the Send API methods from the `Chat` or `Conversation` instances (ex: `chat.say()` or `convo.say()`), but  you can use them from the `BootBot` instance if you're not in a chat or conversation context (for example, when you want to send a notification to a user).

#### `.say()`

| Method signature |
|:-----------------|
| `chat.say(message, [ options ])` |
| `convo.say(message, [ options ])` |
| `bot.say(userId, message, [ options ])` |

Send a message to the user. The `.say()` method can be used to send text messages, button messages, messages with quick replies or attachments. If you want to send a different type of message (like a generic template), see the Send API method for that specific type of message.

The `message` param can be a string or an object:

- If `message` is a string, the bot will send a text message.
- If `message` is an object, the message type will depend on the object's format:

#### `.sendTextMessage()`

TBD

## Examples

Check the `examples` directory to see more demos of:

- An echo bot
- An example conversation with questions and answers
- How to organize your code using modules
- How to use threads to set a Persistent Menu or a Get Started CTA
- How to get the user's profile information

## Credits

Made with (heart emoji) by Maxi Ferreira - [@Charca](https://twitter.com/charca)

## License

MIT

[Features]:#features
[Usage]:#usage
[Video Overview]:#video-overview
[Documentation]:#documentation
[Examples]:#examples
[Credits]:#credits
[License]:#license
