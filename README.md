<p align="center">
	<img src="./assets/logo.png" />
</p>

BootBot is a JavaScript Framework that 

| [Features][] | [Usage][] | [Documentation][] | [Examples][] |
|---|---|---|---|

## Features

- Send messages
- Receive messages

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

## Documentation

Hello world

## Examples

Eee



[Features]:#features
[Usage]:#usage
[Documentation]:#documentation
[Examples]:#examples
