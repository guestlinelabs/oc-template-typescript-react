"use strict";

const createCompile = require("oc-generic-template-compiler").createCompile;
const compileStatics = require("oc-statics-compiler");
const getInfo = require("oc-template-typescript-react").getInfo;

const compileServer = require("./compileServer");
const compileView = require("./compileView");
const verifyConfig = require("./verifyConfig");

const compiler = createCompile({
  compileServer,
  compileStatics,
  compileView,
  getInfo
});

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
  verifyConfig(options.componentPath);

  return compiler(options, callback);
};
