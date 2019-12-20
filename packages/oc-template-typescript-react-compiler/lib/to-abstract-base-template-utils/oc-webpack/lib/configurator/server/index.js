/*jshint camelcase:false */
"use strict";

const MinifyPlugin = require("babel-minify-webpack-plugin");
const externalDependenciesHandlers = require("oc-external-dependencies-handler");
const path = require("path");
const webpack = require("webpack");

module.exports = function webpackConfigGenerator(options) {
  const outputPath = path.join(options.serverPath, "../build");
  const production =
    options.production !== undefined ? options.production : "true";
  const skipTypecheck =
    !production && process.env.TSC_SKIP_TYPECHECK === "true";

  const sourceMaps = !production;
  const devtool = sourceMaps ? "source-map" : "";

  const jsLoaders = [
    {
      loader: require.resolve("ts-loader"),
      options: {
        transpileOnly: skipTypecheck,
        configFile: path.join(options.componentPath, "tsconfig.json"),
        compilerOptions: {
          outDir: outputPath,
          module: "es6",
          target: "es6"
        }
      }
    }
  ];

  const plugins = [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        production ? "production" : "development"
      )
    })
  ];

  if (production) {
    jsLoaders.unshift({
      loader: require.resolve("infinite-loop-loader")
    });
    plugins.unshift(new MinifyPlugin());
  }

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
      path: outputPath,
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
          use: jsLoaders
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
