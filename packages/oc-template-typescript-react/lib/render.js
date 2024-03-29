const React = require("react");
const ReactDOM = require("react-dom");
const ReactDOMServer = require("react-dom/server");

const createPredicate = require("./to-be-published/get-js-from-url");
const tryGetCached = require("./to-be-published/try-get-cached");

module.exports = (options, callback) => {
  try {
    const url = options.model.reactComponent.src;
    const key = options.key;
    const reactKey = options.model.reactComponent.key;
    const props = options.model.reactComponent.props;
    const extractor = (key, context) => context.oc.reactComponents[key];
    const getJsFromUrl = createPredicate({
      key,
      reactKey,
      url,
      globals: {
        React,
        ReactDOM
      },
      extractor
    });

    tryGetCached("reactComponent", reactKey, getJsFromUrl, (err, CachedApp) => {
      if (err) return callback(err);
      try {
        const reactHtml = ReactDOMServer.renderToString(
          React.createElement(CachedApp, props)
        );

        const html = options.template(
          Object.assign({}, options.model, {
            __html: reactHtml
          })
        );
        return callback(null, html);
      } catch (error) {
        return callback(error);
      }
    });
  } catch (err) {
    return callback(err);
  }
};
