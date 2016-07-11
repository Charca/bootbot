'use strict';
const expect = require('chai').expect;
const textMatchesPatterns = require('../../lib/utils/text-matches-patterns');

describe('Utils: textMatchesPatterns', () => {
  it('matches a string against another string', () => {
    expect(textMatchesPatterns('hello', 'hello')).to.deep.equal({ keyword: 'hello' });
    expect(textMatchesPatterns('hello', 'goodbye')).to.equal(false);
  });

  it('matches non case-sensitive strings', () => {
    expect(textMatchesPatterns('Hello', 'hello')).to.deep.equal({ keyword: 'hello' });
    expect(textMatchesPatterns('hello', 'HELLO')).to.deep.equal({ keyword: 'HELLO' });
    expect(textMatchesPatterns('GooDByE', 'GOODbye')).to.deep.equal({ keyword: 'GOODbye' });
  });

  it('matches a string against a RegExp', () => {
    const trueTestCases = [
      { text: 'Hello', re: /hello/i },
      { text: 'yeah', re: /yea(h)?/i },
      { text: 'Hi, my name is Maxi', re: /hi, my name is (.*)/i },
      { text: 'hi', re: /(hello|hi|hey|sup)/i }
    ];
    trueTestCases.forEach(testCase => {
      expect(textMatchesPatterns(testCase.text, testCase.re)).to.deep.equal({
        keyword: testCase.re,
        match: testCase.text.match(testCase.re)
      });
    });

    const falseTestCases = [
      { text: 'Hello', re: /hello/ },
      { text: 'bye', re: /goodbye/ },
      { text: 'Hola', re: /hey( there)?/i }
    ];
    falseTestCases.forEach(testCase => {
      expect(textMatchesPatterns(testCase.text, testCase.re)).to.equal(false);
    });
  });

  it('matches a string against an array of mixed strings and RegExps', () => {
    const patterns = [
      'hello',
      'hi',
      /hey( there)?/i,
      /(sup|whatsup)/i,
      'hola'
    ];

    const testCases = [
      'hello',
      'Hello',
      'HELLO',
      'hi',
      'hey',
      'hey there',
      'WHATSUP',
      'Sup',
      'hoLA'
    ];

    testCases.forEach(testCase => {
      expect(textMatchesPatterns(testCase, patterns)).to.not.equal(false);
    })
  });
});
