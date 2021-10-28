/*jshint camelcase:false */
'use strict';

const externalDependenciesHandlers = require('oc-external-dependencies-handler');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const resolve = require('resolve');
const ESLintPlugin = require('eslint-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function webpackConfigGenerator(options) {
  const production = options.production !== undefined ? !!options.production : true;
  const skipTypecheck =
    !options.usingTypescript || (!production && process.env.TSC_SKIP_TYPECHECK === 'true');
  const appSrc = path.join(options.componentPath, 'src');
  const appNodeModules = path.join(options.componentPath, 'node_modules');

  const sourceMaps = !production;
  const devtool = sourceMaps ? 'source-map' : '';

  const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
  const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
  const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';

  const plugins = [
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
  ].filter(Boolean);

  return {
    mode: production ? 'production' : 'development',
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
    devtool,
    entry: options.serverPath,
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
            compact: !!production
          }
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            production && {
              loader: require.resolve('infinite-loop-loader')
            }
          ].filter(Boolean)
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json']
    },
    plugins,
    logger: options.logger || console,
    stats: options.stats
  };
};
