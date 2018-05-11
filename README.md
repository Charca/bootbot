<p align="center">
	<img src="./assets/logo.png" />
</p>

BootBot is a simple but powerful JavaScript Framework to build Facebook Messenger's Chat bots.

| [Features][] | [Usage][] | [Video Example][] | [Getting Started][] | [Documentation][] | [Examples][] | [Credits][] | [License][] |
|---|---|---|---|---|---|---|---|


**[ :speech_balloon: Questions / Comments? Join our Slack channel!](https://bootbot-slack-channel.herokuapp.com/)**

## Features

- Helper methods to **send** any type of message supported by Facebook.
- **Subscribe** to a particular type of message, or to certain **keywords** sent by the user.
- Start **conversations**, **ask** questions and save important information in the **context** of the conversation.
- Organize your code in **modules**.
- Send automatic or manual **typing indicators**.
- Set your bot's properties, such as a **persistent menu**, a **greeting text** or a **get started CTA**.
- Subscribe to **received** and **read** events.

## Usage

```
$ npm install bootbot --save
```

```javascript
'use strict';
const BootBot = require('bootbot');

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

## Video Example

Creating a Giphy Chat Bot in 3 minutes:

[![IMG](http://i.imgur.com/gDL7Tw2.gif)](https://www.youtube.com/watch?v=flYeg7Hdxzw&feature=youtu.be)

## Getting Started

- Install BootBot via NPM, create a new `index.js`, require BootBot and create a new bot instance using your Facebook Page's / App's `accessToken`, `verifyToken` and `appSecret`:

**Note:** If you don't know how to get these tokens, take a look at Facebook's [Quick Start Guide](https://developers.facebook.com/docs/messenger-platform/guides/quick-start) or check out [this issue](https://github.com/Charca/bootbot/issues/56).

```javascript
// index.js
'use strict';
const BootBot = require('bootbot');

const bot = new BootBot({
  accessToken: 'FB_ACCESS_TOKEN',
  verifyToken: 'FB_VERIFY_TOKEN',
  appSecret: 'FB_APP_SECRET'
});
```

- Subscribe to messages sent by the user with the `bot.on()` and `bot.hear()` methods:

```javascript
bot.on('message', (payload, chat) => {
	const text = payload.message.text;
	console.log(`The user said: ${text}`);
});

bot.hear(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
	console.log('The user said "hello", "hi", "hey", or "hey there"');
});
```

- Reply to user messages using the `chat` object:

```javascript
bot.hear(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
	// Send a text message followed by another text message that contains a typing indicator
	chat.say('Hello, human friend!').then(() => {
		chat.say('How are you today?', { typing: true });
	});
});

bot.hear(['food', 'hungry'], (payload, chat) => {
	// Send a text message with quick replies
	chat.say({
		text: 'What do you want to eat today?',
		quickReplies: ['Mexican', 'Italian', 'American', 'Argentine']
	});
});

bot.hear(['help'], (payload, chat) => {
	// Send a text message with buttons
	chat.say({
		text: 'What do you need help with?',
		buttons: [
			{ type: 'postback', title: 'Settings', payload: 'HELP_SETTINGS' },
			{ type: 'postback', title: 'FAQ', payload: 'HELP_FAQ' },
			{ type: 'postback', title: 'Talk to a human', payload: 'HELP_HUMAN' }
		]
	});
});

bot.hear('image', (payload, chat) => {
	// Send an attachment
	chat.say({
		attachment: 'image',
		url: 'http://example.com/image.png'
	});
});
```

- Start a conversation and keep the user's answers in `context`:

```javascript
bot.hear('ask me something', (payload, chat) => {

	const askName = (convo) => {
		convo.ask(`What's your name?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set('name', text);
			convo.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(convo));
		});
	};

	const askFavoriteFood = (convo) => {
		convo.ask(`What's your favorite food?`, (payload, convo) => {
			const text = payload.message.text;
			convo.set('food', text);
			convo.say(`Got it, your favorite food is ${text}`).then(() => sendSummary(convo));
		});
	};

	const sendSummary = (convo) => {
		convo.say(`Ok, here's what you told me about you:
	      - Name: ${convo.get('name')}
	      - Favorite Food: ${convo.get('food')}`);
      convo.end();
	};

	chat.conversation((convo) => {
		askName(convo);
	});
});
```

- Set up webhooks and start the express server:

```javascript
bot.start();
```

- Start up your bot by running node:

```
$ node index.js
> BootBot running on port 3000
> Facebook Webhook running on localhost:3000/webhook
```

- If you want to test your bot locally, install a localhost tunnel like [ngrok](https://ngrok.com/) and run it on your bot's port:

```
$ ngrok http 3000
```

Then use the provided HTTPS URL to config your webhook on Facebook's Dashboard. For example if the URL provided by ngrok is `https://99b8d4c2.ngrok.io`, use `https://99b8d4c2.ngrok.io/webhook`.

## Documentation

### BootBot Class

#### `new BootBot(options)`

| `options` key | Type | Default | Required |
|:--------------|:-----|:--------|:---------|
| `accessToken` | string | | `Y` |
| `verifyToken` | string | | `Y` |
| `appSecret` | string | | `Y` |
| `webhook` | string | `"/webhook"` | `N` |
| `broadcastEchoes` | boolean | `false` | `N` |

Creates a new `BootBot` instance. Instantiates the new express app and all required webhooks. `options` param must contain all tokens and app secret of your Facebook app. Optionally, set `broadcastEchoes` to `true` if you want the messages your bot send to be echoed back to it (you probably don't need this feature unless you have multiple bots running on the same Facebook page).

If you want to specify a custom endpoint name for your webhook, you can do it with the `webhook` option.

#### `.start([ port ])`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `port` | number | `3000` | `N` |

Starts the express server on the specified port. Defaults port to 3000.

#### `.close()`

Closes the express server (calls `.close()` on the server instance).

---

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
| `referral` | A user that already has a thread with the bot starts a conversation. [more](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events/messaging_referrals) |

You can also subscribe to specific postbacks and quick replies by using a namespace. For example `postback:ADD_TO_CART` subscribes only to the postback event containing the `ADD_TO_CART` payload.

If you want to subscribe to specific keywords on a `message` event, see the `.hear()` method below.

When these events ocurr, the specified callback will be invoked with 3 params: `(payload, chat, data)`

| Param | Description |
|:------|:-----|
| `payload` | The data sent by the user (contains the text of the message, the attachment, etc.) |
| `chat` | A `Chat` instance that you can use to reply to the user. Contains all the methods defined in the [Send API](#send-api) |
| `data` | Contains extra data provided by the framework, like a `captured` flag that signals if this message was already captured by a different callback |

##### `.on()` examples:

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

##### `.hear()` examples:

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

---

### Send API

BootBot provides helper methods for every type of message supported by Facebook's Messenger API. It also provides a generic `sendMessage` method that you can use to send a custom payload. All messages from the Send API return a Promise that you can use to apply actions after a message was successfully sent. You can use this to send consecutive messages and ensure that they're sent in the right order.

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

The `message` param can be a string an array, or an object:

- If `message` is a string, the bot will send a text message.
- If `message` is an array, the `.say()` method will be called once for each element in the array.
- If `message` is an object, the message type will depend on the object's format:

```javascript
// Send a text message
chat.say('Hello world!');

// Send a text message with quick replies
chat.say({
	text: 'Favorite color?',
	quickReplies: ['Red', 'Blue', 'Green']
});

// Send a button template
chat.say({
	text: 'Favorite color?',
	buttons: [
		{ type: 'postback', title: 'Red', payload: 'FAVORITE_RED' },
		{ type: 'postback', title: 'Blue', payload: 'FAVORITE_BLUE' },
		{ type: 'postback', title: 'Green', payload: 'FAVORITE_GREEN' }
	]
});

// Send a list template
chat.say({
	elements: [
		{ title: 'Artile 1', image_url: '/path/to/image1.png', default_action: {} },
		{ title: 'Artile 2', image_url: '/path/to/image2.png', default_action: {} }
	],
	buttons: [
		{ type: 'postback', title: 'View More', payload: 'VIEW_MORE' }
	]
});

// Send a generic template
chat.say({
	cards: [
		{ title: 'Card 1', image_url: '/path/to/image1.png', default_action: {} },
		{ title: 'Card 2', image_url: '/path/to/image2.png', default_action: {} }
	]
});

// Send an attachment
chat.say({
	attachment: 'video',
	url: 'http://example.com/video.mp4'
});

// Passing an array will make subsequent calls to the .say() method
// For example, calling:

chat.say(['Hello', 'How are you?']);

// is the same as:

chat.say('Hello').then(() => {
  chat.say('How are you?')
});
```

The `options` param can contain:

| `options` key | Type | Default | Description |
|:--------------|:-----|:--------|:---------|
| `typing` | boolean or number | `false` | Send a typing indicator before sending the message. If set to `true`, it will automatically calculate how long it lasts based on the message length. If it's a number, it will show the typing indicator for that amount of milliseconds (max. `20000` - 20 seconds) |
| `messagingType` | string | `'RESPONSE'` | The messaging type of the message being sent. |
| `notificationType` | string | | Push notification type: `'REGULAR'`: sound/vibration - `'SILENT_PUSH'`: on-screen notification only - `'NO_PUSH'`: no notification. |
| `tag` | string | | The message tag string. Can only be used if `messagingType` is set to `'MESSAGE_TAG'` |
| `onDelivery` | function | | Callback that will be executed when the message is received by the user. Receives params: `(payload, chat, data)` |
| `onRead` | function | | Callback that will be executed when the message is read by the user. Receives params: `(payload, chat, data)` |

#### `.sendTextMessage()`

| Method signature |
|:-----------------|
| `chat.sendTextMessage(text, [ quickReplies, options ])` |
| `convo.sendTextMessage(text, [ quickReplies, options ])` |
| `bot.sendTextMessage(userId, text, [ quickReplies, options ])` |

The `text` param must be a string containing the message to be sent.

The `quickReplies` param can be an array of strings or [quick_reply objects](https://developers.facebook.com/docs/messenger-platform/send-api-reference/quick-replies).

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendButtonTemplate()`

| Method signature |
|:-----------------|
| `chat.sendButtonTemplate(text, buttons, [ options ])` |
| `convo.sendButtonTemplate(text, buttons, [ options ])` |
| `bot.sendButtonTemplate(userId, text, buttons, [ options ])` |

The `text` param must be a string containing the message to be sent.

The `buttons` param can be an array of strings or [button objects](https://developers.facebook.com/docs/messenger-platform/send-api-reference/button-template).

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendGenericTemplate()`

| Method signature |
|:-----------------|
| `chat.sendGenericTemplate(elements, [ options ])` |
| `convo.sendGenericTemplate(elements, [ options ])` |
| `bot.sendGenericTemplate(userId, elements, [ options ])` |

The `elements` param must be an array of [element objects](https://developers.facebook.com/docs/messenger-platform/send-api-reference/generic-template).

The `options` param extends `options` param of the [`.say()`](#say) method with `imageAspectRatio` property.

#### `.sendListTemplate()`

| Method signature |
|:-----------------|
| `chat.sendListTemplate(elements, buttons, [ options ])` |
| `convo.sendListTemplate(elements, buttons, [ options ])` |
| `bot.sendListTemplate(userId, elements, buttons, [ options ])` |

The `elements` param must be an array of [element objects](https://developers.facebook.com/docs/messenger-platform/send-api-reference/list-template).

The `buttons` param can be an array with one element: string or [button object](https://developers.facebook.com/docs/messenger-platform/send-api-reference/list-template).

The `options` param extends `options` param of the [`.say()`](#say) method with `topElementStyle` property.

#### `.sendTemplate()`

| Method signature |
|:-----------------|
| `chat.sendTemplate(payload, [ options ])` |
| `convo.sendTemplate(payload, [ options ])` |
| `bot.sendTemplate(userId, payload, [ options ])` |

Use this method if you want to send a custom template `payload`, like a [receipt template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/receipt-template) or an [airline itinerary template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/airline-itinerary-template).

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendAttachment()`

| Method signature |
|:-----------------|
| `chat.sendAttachment(type, url, [ quickReplies, options ])` |
| `convo.sendAttachment(type, url, [ quickReplies, options ])` |
| `bot.sendAttachment(userId, type, url, [ quickReplies, options ])` |

The `type` param must be `'image'`, `'audio'`, `'video'` or `'file'`.

The `url` param must be a string with the URL of the attachment.

The `quickReplies` param can be an array of strings or [quick_reply objects](https://developers.facebook.com/docs/messenger-platform/send-api-reference/quick-replies).

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendAction()`

| Method signature |
|:-----------------|
| `chat.sendAction(action, [ options ])` |
| `convo.sendAction(action, [ options ])` |
| `bot.sendAction(userId, action, [ options ])` |

The `action` param must be `'mark_seen'`, `'typing_on'` or `'typing_off'`. To send a typing indicator in a more convenient way, see the [`.sendTypingIndicator`](#sendtypingindicator) method.

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendMessage()`

| Method signature |
|:-----------------|
| `chat.sendMessage(message, [ options ])` |
| `convo.sendMessage(message, [ options ])` |
| `bot.sendMessage(userId, message, [ options ])` |

Use this method if you want to send a custom `message` object.

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

#### `.sendTypingIndicator()`

| Method signature |
|:-----------------|
| `chat.sendTypingIndicator(milliseconds)` |
| `convo.sendTypingIndicator(milliseconds)` |
| `bot.sendTypingIndicator(userId, milliseconds)` |

Convinient method to send a `typing_on` action and then a `typing_off` action after `milliseconds` to simulate the bot is actually typing. Max value is 20000 (20 seconds).

You can also use this method via the `typing` option (see [`.say()`](#say) method).

#### `.getUserProfile()`

| Method signature |
|:-----------------|
| `chat.getUserProfile()` |
| `convo.getUserProfile()` |
| `bot.getUserProfile(userId)` |

This method is not technically part of the "Send" API, but it's listed here because it's also shared between the `bot`, `chat` and `convo` instances.

Returns a Promise that contains the user's [profile information](https://developers.facebook.com/docs/messenger-platform/user-profile).

```javascript
bot.hear('hello', (payload, chat) => {
  chat.getUserProfile().then((user) => {
    chat.say(`Hello, ${user.first_name}!`);
  });
});
```

---

### Conversations

Conversations provide a convinient method to ask questions and handle the user's answer. They're useful when you want to set a flow of different questions/answers, like an onboarding process or when taking an order for example. Conversations also provide a method to save the information that you need from the user's answers, so the interaction is always in context.

Messages sent by the user won't trigger a global `message`, `postback`, `attachment` or `quick_reply` event if there's an active conversation with that user. Answers must be managed by the conversation.

#### `bot.conversation()`

| Method signature |
|:-----------------|
| `chat.conversation(factory)` |
| `bot.conversation(userId, factory)` |

Starts a new conversation with the user.

The `factory` param must be a function that is executed immediately receiving the `convo` instance as it's only param:

```
bot.on('hello', (payload, chat) => {
	chat.conversation((convo) => {
		// convo is available here...
		convo.ask( ... );
	});
});
```

#### `convo.ask(question, answer, [ callbacks, options ])`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `question` | string, object or function | | `Y` |
| `answer` | function | | `Y` |
| `callbacks` | array | | `N` |
| `options` | object | | `N` |

If `question` is a string or an object, the `.say()` method will be invoked immediately with that string or object, if it's a function it will also be invoked immedately with the `convo` instance as its only param.

The `answer` param must be a function that receives the `payload`, `convo` and `data` params (similar to the callback function of the `.on()` or `.hear()` methods, except it receives the `convo` instance instead of the `chat` instance). The `answer` function will be called whenever the user replies to the `question` with a text message or quick reply.

The `callbacks` array can be used to listen to specific types of answers to the `question`. You can listen for `postback`, `quick_reply` and `attachment` events, or you can match a specific text `pattern`. See example bellow:

The `options` param is identical to the `options` param of the [`.say()`](#say) method.

##### `convo.ask()` example:

```javascript
const question = {
	text: `What's your favorite color?`,
	quickReplies: ['Red', 'Green', 'Blue']
};

const answer = (payload, convo) => {
	const text = payload.message.text;
	convo.say(`Oh, you like ${text}!`);
};

const callbacks = [
	{
		event: 'quick_reply',
		callback: () => { /* User replied using a quick reply */ }
	},
	{
		event: 'attachment',
		callback: () => { /* User replied with an attachment */ }
	},
	{
		pattern: ['black', 'white'],
		callback: () => { /* User said "black" or "white" */ }
	}
];

const options = {
	typing: true // Send a typing indicator before asking the question
};

convo.ask(question, answer, callbacks, options);
```

#### `convo.set(property, value)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `property` | string | | `Y` |
| `value` | mixed | | `Y` |

Save a value in the conversation's context. This value will be available in all subsequent questions and answers that are part of this conversation, but the values are lost once the conversation ends.

```javascript
convo.question(`What's your favorite color?`, (payload, convo) => {
	const text = payload.message.text;

	// Save the user's answer in the conversation's context.
	// You can then call convo.get('favoriteColor') in a future question or answer to retrieve the value.
	convo.set('favoriteColor', text);
	convo.say(`Oh, you like ${text}!`);
});
```

#### `convo.get(property)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `property` | string | | `Y` |

Retrieve a value from the conversation's context.

#### `convo.end()`

Ends a conversation, giving control back to the `bot` instance. All `.on()` and `.hear()` listeners are now back in action. After you end a conversation the values that you saved using the `convo.set()` method are now lost.

You must call `convo.end()` after you no longer wish to interpret user's messages as `answer`s to one of your `questions`. If you don't, and a message is received with no `answer` callback listening, the conversation will be ended automatically.

---

### Modules

Modules are simple functions that you can use to organize your code in different files and folders.

#### `.module(factory)`

The `factory` param is a function that gets called immediatly and receives the `bot` instance as its only parameter. For example:

```javascript
// help-module.js
module.exports = (bot) => {
	bot.hear('help', (payload, chat) => {
		// Send Help Menu to the user...
	});
};

// index.js
const helpModule = require('./help-module');
bot.module(helpModule);
```

Take a look at the `examples/module-example.js` file for a complete example.

---

### Messenger Profile API

#### `.setGreetingText(text)`

[Facebook Docs](https://developers.facebook.com/docs/messenger-platform/messenger-profile/greeting-text)

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `text` | string or array | | `Y` |

Set a greeting text for new conversations. The Greeting Text is only rendered the first time the user interacts with a the Page on Messenger.

**Localization support:** `text` can be a string containing the greeting text, or an array of objects to support multiple locales. For more info on the format of these objects, see [the documentation](https://developers.facebook.com/docs/messenger-platform/messenger-profile/greeting-text).

#### `.setGetStartedButton(action)`

[Facebook Docs](https://developers.facebook.com/docs/messenger-platform/messenger-profile/get-started-button)

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `action` | string or function | | `Y` |

React to a user starting a conversation with the bot by clicking the Get Started button. If `action` is a string, the Get Started button postback will be set to that string. If it's a function, that callback will be executed when a user clicks the Get Started button.

#### `.deleteGetStartedButton()`

Removes the Get Started button call to action.

#### `.setPersistentMenu(buttons, [ disableInput ])`

[Facebook Docs](https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu)

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `buttons` | array of strings or objects | | `Y` |
| `disableInput ` | boolean | `false` | `N` |

Creates a Persistent Menu that is available at any time during the conversation. The `buttons` param can be an array of strings, button objects, or locale objects.

If `disableInput` is set to `true`, it will disable user input in the menu. The user will only be able to interact with the bot via the menu, postbacks, buttons and webviews.

**Localization support:** if `buttons` is an array of objects containing a `locale` attribute, it will be used as-is, expecting it to be an array of localized menues. For more info on the format of these objects, see [the documentation](https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu).

#### `.deletePersistentMenu()`

Removes the Persistent Menu.

----------------------

### Bypassing Express

You may only want to use bootbot for the Facebook related config and the simple to use Send API features but handle routing from somewhere else. Or there may be times where you want to send a message out of band, like if you get a postback callback and need to end a conversation flow immediately.

Or maybe you don't want to use express but a different HTTP server.

#### `.handleFacebookData(data)`

Use this to send a message from a parsed webhook message directly to your bot.

```js
const linuxNewsBot   = new BootBot({argz});
const appleNewsBot   = new BootBot({argz});
const windowsNewsBot = new BootBot({argz});

myNonExpressRouter.post("/mywebhook", (data) => {
	const messages = data.entry[0].messaging;
	messages.forEach(message => {
		switch(data.entry.id) {
			case LINUX_BOT_PAGE_ID:
				linuxNewsBot.handleFacebookData(message);
				break;
			case APPLE_BOT_PAGE_ID:
				appleNewsBot.handleFacebookData(message);
				break;
			// ...
		};
	});
});
```

## Examples

Check the `examples` directory to see more demos of:

- An echo bot
- A bot that searches for random gifs
- An example conversation with questions and answers
- How to organize your code using modules
- How to use the Messenger Profile API to set a Persistent Menu or a Get Started CTA
- How to get the user's profile information

To run the examples, make sure to complete the `examples/config/default.json` file with your bot's tokens, and then cd into the `examples` folder and run the desired example with node. For example:

```
$ cd examples
$ node echo-example.js
```

## Credits

Made with :beer: by Maxi Ferreira - [@Charca](https://twitter.com/charca)

## License

MIT

[Features]:#features
[Usage]:#usage
[Video Example]:#video-example
[Getting Started]:#getting-started
[Documentation]:#documentation
[Examples]:#examples
[Credits]:#credits
[License]:#license
