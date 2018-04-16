'use strict';

/**
 * @param {String} str
 * @returns {String}
 */
module.exports = (str) => (
  str.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase()
);
