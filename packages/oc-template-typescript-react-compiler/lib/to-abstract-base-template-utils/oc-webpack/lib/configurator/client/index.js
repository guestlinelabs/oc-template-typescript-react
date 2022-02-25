'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const _ = require('lodash');
const loaderUtils = require('loader-utils');
const postcssNormalize = require('postcss-normalize');

const commonConfig = require('../commonConfig');
const createExcludeRegex = require('../createExcludeRegex');

// const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
// DISABLE UNTIL FIGURE HOW TO MAKE IT WORK WITH TESTS
const shouldUseSourceMap = false;

function getCacheIdentifier(environment, packages) {
  let cacheIdentifier = environment == null ? '' : environment.toString();
  for (const packageName of packages) {
    cacheIdentifier += `:${packageName}@`;
    try {
      cacheIdentifier += require(`${packageName}/package.json`).version;
    } catch (_) {
      // ignored
    }
  }
  return cacheIdentifier;
}

module.exports = (options) => {
  const buildPath = options.buildPath || '/build';
  const appSrc = path.join(options.componentPath, 'src');
  const appPackage = path.join(options.componentPath, '_package');
  const isEnvProduction = !!options.production;
  const isEnvDevelopment = !isEnvProduction;

  process.env.BABEL_ENV = isEnvProduction ? 'production' : 'development';
  const buildIncludes = options.buildIncludes.concat('oc-template-typescript-react-compiler/utils');
  const excludeRegex = createExcludeRegex(buildIncludes);

  function getLocalIdent(context, localIdentName, localName, options) {
    // Use the filename or folder name, based on some uses the index.js / index.module.(css|scss|sass) project style
    const fileNameOrFolder = context.resourcePath.match(/index\.module\.(css|scss|sass)$/)
      ? '[folder]'
      : '[name]';
    // Create a hash based on a the file location and class name. Will be unique across a project, and close to globally unique.
    const hash = loaderUtils.getHashDigest(
      path.posix.relative(context.rootContext, context.resourcePath) + localName,
      'md5',
      'base64',
      5
    );
    // Use loaderUtils to find the file or folder name
    const className = loaderUtils.interpolateName(
      context,
      fileNameOrFolder + '_' + localName + '__' + hash,
      options
    );
    // Remove the .module that appears in every classname when based on the file and replace all "." with "_".
    return className.replace('.module_', '_').replace(/\./g, '_');
  }

  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [
              require('postcss-flexbugs-fixes'),
              [
                require('postcss-preset-env'),
                {
                  autoprefixer: {
                    flexbox: 'no-2009'
                  },
                  stage: 3
                }
              ],
              postcssNormalize()
            ]
          },
          sourceMap: isEnvProduction && shouldUseSourceMap
        }
      }
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction ? shouldUseSourceMap : true,
            root: appSrc
          }
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true
          }
        }
      );
    }
    return loaders;
  };

  const polyfills = ['Object.assign'];

  return {
    ...commonConfig({
      configPath: __dirname,
      isEnvProduction,
      entry: options.viewPath,
      usingTypescript: options.usingTypescript,
      componentPath: options.componentPath
    }),
    context: options.componentPath,
    output: {
      path: buildPath,
      pathinfo: isEnvDevelopment,
      filename: options.publishFileName,
      libraryTarget: 'assign',
      library: 'module'
    },
    externals: _.omit(options.externals, polyfills),
    module: {
      strictExportPresence: true,
      rules: [
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          loader: require.resolve('source-map-loader')
        },
        {
          oneOf: [
            {
              test: /\.css$/,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: false,
                modules: {
                  mode: 'local',
                  getLocalIdent
                }
              })
            },
            {
              test: /\.(scss|sass)$/,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: false,
                  modules: {
                    compileType: 'icss'
                  }
                },
                'sass-loader'
              )
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: [appSrc, appPackage, ...options.includePaths],
              exclude: excludeRegex,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                presets: [
                  [
                    require.resolve('babel-preset-react-app'),
                    {
                      runtime: 'classic'
                    }
                  ]
                ],
                babelrc: false,
                configFile: false,
                cacheIdentifier: getCacheIdentifier(
                  isEnvProduction ? 'production' : 'development',
                  [
                    'babel-plugin-named-asset-import',
                    'babel-preset-react-app',
                    'react-dev-utils',
                    'react-scripts'
                  ]
                ),
                plugins: [
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]'
                        }
                      }
                    }
                  ]
                ].filter(Boolean),
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction
              }
            }
          ]
        },
        {
          test: /\.(js|mjs)$/,
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            compact: false,
            presets: [[require.resolve('babel-preset-react-app/dependencies'), { helpers: true }]],
            cacheDirectory: true,
            cacheCompression: false,
            cacheIdentifier: getCacheIdentifier(
              isEnvProduction ? 'production' : isEnvDevelopment && 'development',
              [
                'babel-plugin-named-asset-import',
                'babel-preset-react-app',
                'react-dev-utils',
                'react-scripts'
              ]
            ),
            sourceMaps: shouldUseSourceMap,
            inputSourceMap: shouldUseSourceMap
          }
        }
      ].filter(Boolean)
    }
  };
};
