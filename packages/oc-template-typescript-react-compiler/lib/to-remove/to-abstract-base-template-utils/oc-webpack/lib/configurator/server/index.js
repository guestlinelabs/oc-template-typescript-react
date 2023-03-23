/*jshint camelcase:false */
'use strict';

const externalDependenciesHandlers = require('oc-external-dependencies-handler');
const path = require('path');
const commonConfig = require('../commonConfig');

module.exports = function webpackConfigGenerator(options) {
  const isEnvProduction = options.production !== undefined ? !!options.production : true;

  return {
    ...commonConfig({
      configPath: __dirname,
      isEnvProduction,
      entry: options.serverPath,
      usingTypescript: options.usingTypescript,
      componentPath: options.componentPath
    }),
    target: 'node',
    output: {
      path: path.join(options.serverPath, '../build'),
      filename: options.publishFileName,
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    externals: externalDependenciesHandlers(options.dependencies),
    module: {
      rules: [
        // First, run the linter.
        // It's important to do this before Babel processes the JS
        {
          test: /\.(t|j)sx?$/,
          exclude: /node_modules/,
          loader: require.resolve('babel-loader'),
          options: {
            customize: require.resolve('babel-preset-react-app/webpack-overrides'),
            presets: [require.resolve('@babel/preset-typescript')],
            babelrc: false,
            configFile: false,
            cacheDirectory: true,
            cacheCompression: false,
            compact: !!isEnvProduction
          }
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            isEnvProduction && {
              loader: require.resolve('infinite-loop-loader')
            }
          ].filter(Boolean)
        }
      ]
    },
    logger: options.logger || console,
    stats: options.stats
  };
};
