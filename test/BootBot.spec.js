'use strict';
const expect = require('chai').expect;
const BootBot = require('../lib/BootBot');

describe('BootBot', () => {
  it('creates a bot instance', () => {
    const options = {
      accessToken: '1234',
      verifyToken: '5678',
      appSecret: 'foobar'
    };

    const bot = new BootBot(options);
    expect(() => new BootBot(options)).to.not.throw();
    expect(bot instanceof BootBot).to.equal(true);
  });

  it('throws an error if there are missing tokens', () => {
    expect(() => new BootBot()).to.throw(Error);
  });
});
