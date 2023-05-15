"use strict";
const request = require("minimal-request");
const vm = require("vm");

module.exports = ({ url, key, reactKey, globals, timeout = 5000, extractor }) => cb => {
  request(
    {
      url,
      timeout
    },
    (err, jsAsText) => {
      if (err) {
        return cb({
          status: err,
          response: {
            error: `request ${url} failed (${jsAsText})`
          }
        });
      }

      const context = Object.assign({}, globals);

      try {
        vm.runInNewContext(`
        ${jsAsText}
        oc.components['${key}']();
        `,
          context);
      } catch (err) {
        return cb(err);
      }
      const cached = extractor(reactKey, context);
      cb(null, cached);
    }
  );
};
