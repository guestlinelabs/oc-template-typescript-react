'use strict';

const createCompile = require('oc-generic-template-compiler').createCompile;
const compileStatics = require('oc-statics-compiler');
const getInfo = require('oc-template-typescript-react').getInfo;
const react = require('@vitejs/plugin-react');

const viteView = require('./to-publish/viteView');
const viteServer = require('./to-publish/viteServer');
const verifyTypeScriptSetup = require('./verifyConfig');
const higherOrderServerTemplate = require('./higherOrderServerTemplate');
const reactOCProviderTemplate = require('./reactOCProviderTemplate');
const htmlTemplate = require('./htmlTemplate');

const compiler = createCompile({
  compileView: (options, cb) =>
    viteView(
      {
        ...options,
        plugins: [react()],
        viewWrapper: ({ viewPath }) => reactOCProviderTemplate({ viewPath }),
        htmlTemplate,
        externals: getInfo().externals
      },
      cb
    ),
  compileServer: (options, cb) =>
    viteServer({ ...options, serverWrapper: higherOrderServerTemplate }, cb),
  compileStatics,
  getInfo
});

const hasTsExtension = (file) => !!file.match(/\.tsx?$/);

// OPTIONS
// =======
// componentPath
// componentPackage,
// logger,
// minify
// ocPackage
// publishPath
// verbose,
// watch,
// production
module.exports = function compile(options, callback) {
  const viewFileName = options.componentPackage.oc.files.template.src;
  const serverFileName = options.componentPackage.oc.files.data;
  const usingTypescript = hasTsExtension(viewFileName) || hasTsExtension(serverFileName);

  if (usingTypescript) {
    verifyTypeScriptSetup(options.componentPath);
  }

  return compiler(options, callback);
};
