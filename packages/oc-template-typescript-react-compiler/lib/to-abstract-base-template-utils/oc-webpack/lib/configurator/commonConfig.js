const path = require('path');
const resolve = require('resolve');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

// const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const shouldUseSourceMap = false;
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';

module.exports = function getConfig({
  componentPath,
  isEnvProduction,
  entry,
  usingTypescript,
  configPath
}) {
  const isEnvDevelopment = !isEnvProduction;
  const skipTypecheck =
    !usingTypescript || (isEnvDevelopment && process.env.TSC_SKIP_TYPECHECK === 'true');
  const appSrc = path.join(componentPath, 'src');
  const appNodeModules = path.join(componentPath, 'node_modules');

  const config = {
    mode: isEnvProduction ? 'production' : 'development',
    bail: isEnvProduction,
    entry,
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json', '.css']
    },
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : 'cheap-module-source-map',
    optimization: {
      // https://webpack.js.org/configuration/optimization/
      // Override production mode optimization for minification
      // As it currently breakes the build, still rely on babel-minify-webpack-plugin instead
      minimize: isEnvProduction,
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
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        allChunks: true,
        ignoreOrder: true
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isEnvProduction ? 'production' : 'development')
      }),
      !skipTypecheck &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync('typescript', {
            basedir: path.join(componentPath, 'node_modules')
          }),
          compilerOptions: {
            allowJs: false
          },
          async: isEnvDevelopment,
          useTypescriptIncrementalApi: true,
          checkSyntacticErrors: true,
          resolveModuleNameModule: process.versions.pnp
            ? path.join(__dirname, 'pnpTs.js')
            : undefined,
          resolveTypeReferenceDirectiveModule: process.versions.pnp
            ? path.join(__dirname, 'pnpTs.js')
            : undefined,
          tsconfig: path.join(componentPath, 'tsconfig.json'),
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
          formatter: require.resolve('./eslintFormatter'),
          eslintPath: require.resolve('eslint'),
          failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
          context: appSrc,
          cache: true,
          cacheLocation: path.resolve(appNodeModules, '.cache/.eslintcache'),
          // ESLint class options
          cwd: componentPath,
          resolvePluginsRelativeTo: configPath,
          baseConfig: {
            extends: [require.resolve('eslint-config-react-app/base')]
          }
        })
    ].filter(Boolean)
  };
  return config;
};
