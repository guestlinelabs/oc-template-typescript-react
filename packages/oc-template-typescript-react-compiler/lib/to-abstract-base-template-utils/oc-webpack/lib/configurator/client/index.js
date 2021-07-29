'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const webpack = require('webpack');
const resolve = require('resolve');
const _ = require('lodash');
const postcssNormalize = require('postcss-normalize');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const ESLintPlugin = require('eslint-webpack-plugin');

const createExcludeRegex = require('../createExcludeRegex');

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';

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

module.exports = options => {
  const buildPath = options.buildPath || '/build';
  const appNodeModules = path.join(options.componentPath, 'node_modules');
  const appSrc = path.join(options.componentPath, 'src');
  const production = options.production;
  process.env.BABEL_ENV = production ? 'production' : 'development';
  const skipTypecheck = !production && process.env.TSC_SKIP_TYPECHECK === 'true';
  const buildIncludes = options.buildIncludes.concat('oc-template-typescript-react-compiler/utils');
  const excludeRegex = createExcludeRegex(buildIncludes);
  const localIdentName = !production
    ? 'oc__[path][name]-[ext]__[local]__[hash:base64:8]'
    : '[local]__[hash:base64:8]';

  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      !production && require.resolve('style-loader'),
      production && {
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
          sourceMap: production && shouldUseSourceMap
        }
      }
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: production ? shouldUseSourceMap : true,
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
    context: options.componentPath,
    mode: production ? 'production' : 'development',
    bail: production,
    devtool: production ? (shouldUseSourceMap ? 'source-map' : false) : 'cheap-module-source-map',
    optimization: {
      // https://webpack.js.org/configuration/optimization/
      // Override production mode optimization for minification
      // As it currently breakes the build, still rely on babel-minify-webpack-plugin instead
      minimize: production,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2
            },
            mangle: {
              safari10: true
            },
            keep_classnames: false,
            keep_fnames: false,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          },
          sourceMap: shouldUseSourceMap
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  inline: false,
                  annotation: true
                }
              : false
          },
          cssProcessorPluginOptions: {
            preset: ['default', { minifyFontValues: { removeQuotes: false } }]
          }
        })
      ]
    },
    entry: options.viewPath,
    output: {
      path: buildPath,
      pathinfo: !production,
      filename: options.publishFileName,
      futureEmitAssets: true
    },
    externals: _.omit(options.externals, polyfills),
    module: {
      strictExportPresence: true,
      rules: [
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          use: 'source-map-loader'
        },
        {
          oneOf: [
            {
              test: /\.css$/,
              use: getStyleLoaders({
                importLoaders: 1,
                modules: true,
                localIdentName,
                camelCase: true
              })
            },
            {
              test: /\.(scss|sass)$/,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  modules: true,
                  localIdentName,
                  camelCase: true
                },
                'sass-loader'
              )
            },
            {
              test: /\.(t|j)sx?$/,
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
                cacheIdentifier: getCacheIdentifier(production ? 'production' : 'development', [
                  'babel-plugin-named-asset-import',
                  'babel-preset-react-app',
                  'react-dev-utils',
                  'react-scripts'
                ]),
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
                compact: !!production
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        allChunks: true,
        ignoreOrder: true
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development')
      }),
      !skipTypecheck &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync('typescript', {
            basedir: path.join(options.componentPath, 'node_modules')
          }),
          compilerOptions: {
            allowJs: false
          },
          async: !production,
          useTypescriptIncrementalApi: true,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? path.join(__dirname, '..', 'pnpTs.js')
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? path.join(__dirname, '..', 'pnpTs.js')
            : undefined,
          tsconfig: path.join(options.componentPath, 'tsconfig.json'),
          reportFiles: [
            '**',
            '!**/__tests__/**',
            '!**/?(*.)(spec|test).*',
            '!**/src/setupProxy.*',
            '!**/src/setupTests.*'
          ],
          silent: true
        }),
      !disableESLintPlugin &&
        new ESLintPlugin({
          // Plugin options
          extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
          formatter: require.resolve('../eslintFormatter'),
          eslintPath: require.resolve('eslint'),
          failOnError: !(!production && emitErrorsAsWarnings),
          context: appSrc,
          cache: true,
          cacheLocation: path.resolve(appNodeModules, '.cache/.eslintcache'),
          // ESLint class options
          cwd: options.componentPath,
          resolvePluginsRelativeTo: __dirname,
          baseConfig: {
            extends: [require.resolve('eslint-config-react-app/base')]
          }
        })
    ].filter(Boolean),
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json', '.css']
    }
  };
};
