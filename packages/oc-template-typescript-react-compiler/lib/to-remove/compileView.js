'use strict';

const async = require('async');
const fs = require('fs-extra');
const hashBuilder = require('oc-hash-builder');
const MemoryFS = require('memory-fs');
const ocViewWrapper = require('oc-view-wrapper');
const path = require('path');
const strings = require('oc-templates-messages');

const reactBundleWrapper = (content) => {
  const iife = `(function() {
  ${content}
  ; return module.default}())`;

  return iife;
};

const {
  compiler,
  configurator: { client: webpackConfigurator }
} = require('./to-abstract-base-template-utils/oc-webpack');

const fontFamilyUnicodeParser = require('./to-abstract-base-template-utils/font-family-unicode-parser');
const reactOCProviderTemplate = require('./reactOCProviderTemplate');
const viewTemplate = require('./viewTemplate');

const hasTsExtension = (file) => !!file.match(/\.tsx?$/);

module.exports = (options, callback) => {
  function processRelativePath(relativePath) {
    let pathStr = path.join(options.componentPath, relativePath);
    if (process.platform === 'win32') {
      return pathStr.split('\\').join('\\\\');
    }
    return pathStr;
  }

  const viewFileName = options.componentPackage.oc.files.template.src;
  const usingTypescript = hasTsExtension(viewFileName);
  const componentPath = options.componentPath;
  const viewPath = processRelativePath(viewFileName);

  const includePaths = [options.include].flat().filter(Boolean).map(processRelativePath);
  const publishPath = options.publishPath;
  const tempPath = path.join(publishPath, 'temp');
  const publishFileName = options.publishFileName || 'template.js';
  const componentPackage = options.componentPackage;
  const { getInfo } = require('../index');
  const externals = getInfo().externals;
  const production = options.production;

  const reactOCProviderContent = reactOCProviderTemplate({ viewPath });
  const reactOCProviderName = 'reactOCProvider.tsx';
  const reactOCProviderPath = path.join(tempPath, reactOCProviderName);

  const compile = (options, cb) => {
    const config = webpackConfigurator({
      componentPath,
      viewPath: options.viewPath,
      includePaths,
      externals: externals.reduce((externals, dep) => {
        externals[dep.name] = dep.global;
        return externals;
      }, {}),
      publishFileName,
      usingTypescript,
      production,
      buildIncludes: componentPackage.oc.files.template.buildIncludes || []
    });
    compiler(config, (err, data) => {
      if (err) {
        return cb(err);
      }

      const memoryFs = new MemoryFS(data);
      const bundle = memoryFs.readFileSync(`/build/${config.output.filename}`, 'UTF8');

      const bundleHash = hashBuilder.fromString(bundle);
      const wrappedBundle = reactBundleWrapper(bundle);

      let css = null;
      const cssFile = Object.keys(data.build).filter((x) => x.endsWith('.css'))[0];
      if (cssFile) {
        // This is an awesome hack by KimTaro that will blow your mind.
        // Remove it once this get merged: https://github.com/webpack-contrib/css-loader/pull/523
        css = fontFamilyUnicodeParser(memoryFs.readFileSync(`/build/${cssFile}`, 'UTF8'));

        const cssPath = path.join(publishPath, `styles.css`);
        // We convert single quotes to double quotes in order to
        // support the viewTemplate's string interpolation
        fs.outputFileSync(cssPath, css.replace(/'/g, '"'));
      }

      const reactRoot = `oc-reactRoot-${componentPackage.name}`;
      const templateString = viewTemplate({
        reactRoot,
        css,
        externals,
        wrappedBundle,
        hash: bundleHash
      });

      const templateStringCompressed = production
        ? templateString.replace(/\s+/g, ' ')
        : templateString;
      const hash = hashBuilder.fromString(templateStringCompressed);
      const view = ocViewWrapper(hash, templateStringCompressed);
      return cb(null, {
        template: { view, hash },
        bundle: { hash: bundleHash }
      });
    });
  };

  async.waterfall(
    [
      (next) => fs.outputFile(reactOCProviderPath, reactOCProviderContent, next),
      (next) => compile({ viewPath: reactOCProviderPath }, next),
      (compiled, next) => fs.remove(reactOCProviderPath, (err) => next(err, compiled)),
      (compiled, next) => fs.ensureDir(publishPath, (err) => next(err, compiled)),
      (compiled, next) =>
        fs.writeFile(path.join(publishPath, publishFileName), compiled.template.view, (err) =>
          next(err, compiled)
        )
    ],
    (err, compiled) => {
      if (err) {
        return callback(strings.errors.compilationFailed(viewFileName, err));
      }
      callback(null, {
        template: {
          type: options.componentPackage.oc.files.template.type,
          hashKey: compiled.template.hash,
          src: publishFileName
        },
        bundle: { hashKey: compiled.bundle.hash }
      });
    }
  );
};
