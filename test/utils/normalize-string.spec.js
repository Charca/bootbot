'use strict';
const expect = require('chai').expect;
const normalizeString = require('../../lib/utils/normalize-string');

describe('Utils: normalizeString', () => {
  it('capitalizes and removes spaces and special characters from a string', () => {
    const testCases = [
      { string: 'Hello World', expected: 'HELLOWORLD' },
      { string: 'hello w0rld', expected: 'HELLOW0RLD' },
      { string: 'h3!!0 %0#@6', expected: 'H3006' },
      { string: `It's a me! Mario!`, expected: 'ITSAMEMARIO' },
      { string: 'HELLOWORLD', expected: 'HELLOWORLD' }
    ];
    testCases.forEach(testCase => {
      expect(normalizeString(testCase.string)).to.equal(testCase.expected);
    });
  });

  it('removes emoji special characters', () => {
    const testCases = [
      { string: '\u{1F4A9}', expected: '' },
      { string: 'Hello \u{1F4A9}', expected: 'HELLO' },
      { string: 'Poop 💩', expected: 'POOP' }
    ];
    testCases.forEach(testCase => {
      expect(normalizeString(testCase.string)).to.equal(testCase.expected);
    });
  });
});
