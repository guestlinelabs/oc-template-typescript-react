/*jshint camelcase:false */
"use strict";

const MinifyPlugin = require("babel-minify-webpack-plugin");
const externalDependenciesHandlers = require("oc-external-dependencies-handler");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const resolve = require("resolve");

module.exports = function webpackConfigGenerator(options) {
  const production =
    options.production !== undefined ? !!options.production : true;
  const skipTypecheck =
    !production && process.env.TSC_SKIP_TYPECHECK === "true";

  const sourceMaps = !production;
  const devtool = sourceMaps ? "source-map" : "";

  const fileLoaders = [
    production && {
      loader: require.resolve("infinite-loop-loader")
    },
    {
      loader: require.resolve("babel-loader"),
      options: {
        customize: require.resolve("babel-preset-react-app/webpack-overrides"),
        cacheCompression: false,
        sourceMaps,
        sourceRoot: path.join(options.serverPath, ".."),
        compact: !!production,
        cacheDirectory: !production,
        babelrc: false,
        configFile: false,
        presets: [require.resolve("babel-preset-react-app")]
      }
    }
  ].filter(Boolean);

  const plugins = [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        production ? "production" : "development"
      )
    }),
    production && new MinifyPlugin(),
    !skipTypecheck &&
      new ForkTsCheckerWebpackPlugin({
        typescript: resolve.sync("typescript", {
          basedir: path.join(options.componentPath, "node_modules")
        }),
        compilerOptions: {
          allowJs: false
        },
        async: !production,
        useTypescriptIncrementalApi: true,
        checkSyntacticErrors: true,
        resolveModuleNameModule: process.versions.pnp
          ? path.join(__dirnamem, "..", pnpTs.js)
          : undefined,
        resolveTypeReferenceDirectiveModule: process.versions.pnp
          ? path.join(__dirnamem, "..", pnpTs.js)
          : undefined,
        tsconfig: path.join(options.componentPath, "tsconfig.json"),
        reportFiles: [
          "**",
          "!**/__tests__/**",
          "!**/?(*.)(spec|test).*",
          "!**/src/setupProxy.*",
          "!**/src/setupTests.*"
        ],
        silent: true
      })
  ].filter(Boolean);

  return {
    mode: production ? "production" : "development",
    optimization: {
      // https://webpack.js.org/configuration/optimization/
      // Override production mode optimization for minification
      // As it currently breakes the build, still rely on babel-minify-webpack-plugin instead
      minimize: false
    },
    devtool,
    entry: options.serverPath,
    target: "node",
    output: {
      path: path.join(options.serverPath, "../build"),
      filename: options.publishFileName,
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
      devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]"
    },
    externals: externalDependenciesHandlers(options.dependencies),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: fileLoaders
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".json"]
    },
    plugins,
    logger: options.logger || console,
    stats: options.stats
  };
};
