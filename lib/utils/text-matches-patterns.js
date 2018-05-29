'use strict';

/**
 * @param {String} text 
 * @param {Array.<String>|String} patterns
 */
module.exports = (text, patterns) => {
  const keywords = Array.isArray(patterns) ? patterns : [ patterns ];
  for (let i = 0; i < keywords.length; i += 1) {
    const keyword = keywords[i];
    if (typeof keyword === 'string' && keyword.toLowerCase() === text.toLowerCase()) {
      return { keyword };
    } else if (keyword instanceof RegExp && keyword.test(text)) {
      return {
        keyword,
        match: text.match(keyword)
      };
    }
  }
  return false;
};
