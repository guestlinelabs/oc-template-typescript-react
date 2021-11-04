const path = require('path');
const resolve = require('resolve');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

// const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const shouldUseSourceMap = false;
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx'
];

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
  const appTsBuildInfoFile = path.join(
    componentPath,
    'node_modules',
    '.cache',
    'tsconfig.tsbuildinfo'
  );

  const config = {
    mode: isEnvProduction ? 'production' : 'development',
    bail: isEnvProduction,
    entry,
    resolve: {
      extensions: moduleFileExtensions
        .map((ext) => `.${ext}`)
        .filter((ext) => usingTypescript || !ext.includes('ts'))
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
        new CssMinimizerPlugin()
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
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: path.join(componentPath, 'node_modules')
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: appTsBuildInfoFile
              }
            },
            context: componentPath,
            diagnosticOptions: {
              syntactic: true
            },
            mode: 'write-references'
          },
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupProxy.*' },
              { file: '**/src/setupTests.*' }
            ]
          },
          logger: {
            infrastructure: 'silent'
          }
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
