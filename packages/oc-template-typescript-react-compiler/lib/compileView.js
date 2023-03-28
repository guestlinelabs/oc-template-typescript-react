const react = require('@vitejs/plugin-react');
const viteView = require('./to-publish/viteView');
const viteServer = require('./to-publish/viteServer');
const reactOCProviderTemplate = require('./reactOCProviderTemplate');
const htmlTemplate = require('./htmlTemplate');
const higherOrderServerTemplate = require('./higherOrderServerTemplate');

function comp(options) {
  const x = viteServer({
    ...options,
    serverWrapper: higherOrderServerTemplate
  });
  console.log(x);
  return viteView({
    ...options,
    plugins: [react()],
    viewWrapper: ({ viewPath }) => reactOCProviderTemplate({ viewPath }),
    htmlTemplate
  });
}

module.exports = comp;
