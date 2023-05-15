'use strict';

const genericRenderer = require('oc-generic-template-renderer');
const React = require('react');
const ReactDOM = require('react-dom');

const render = require('./lib/render');
const packageJson = require('./package.json');

module.exports = {
  getCompiledTemplate: (templateString, key) => genericRenderer.getCompiledTemplate(templateString, key, { React, ReactDOM }),
  getInfo: () => genericRenderer.getInfo(packageJson),
  render,
};
