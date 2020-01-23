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
        // First, run the linter.
        // It's important to do this before Babel processes the JS
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          enforce: "pre",
          use: [
            {
              options: {
                cache: true,
                formatter: require.resolve("../eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                resolvePluginsRelativeTo: __dirname,
                ignore: process.env.EXTEND_ESLINT === "true",
                baseConfig: (() => {
                  // We allow overriding the config only if the env variable is set
                  if (process.env.EXTEND_ESLINT === "true") {
                    const eslintCli = new eslint.CLIEngine();
                    let eslintConfig;
                    try {
                      eslintConfig = eslintCli.getConfigForFile(
                        path.join(options.componentPath, "src", "index.js")
                      );
                    } catch (e) {
                      console.error(e);
                      process.exit(1);
                    }
                    return eslintConfig;
                  } else {
                    return {
                      extends: [require.resolve("eslint-config-react-app")]
                    };
                  }
                })(),
                useEslintrc: false
              },
              loader: require.resolve("eslint-loader")
            }
          ],
          include: path.join(options.componentPath, "src")
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: require.resolve("babel-loader"),
              options: {
                customize: require.resolve(
                  "babel-preset-react-app/webpack-overrides"
                ),
                cacheCompression: false,
                sourceMaps,
                sourceRoot: path.join(options.serverPath, ".."),
                compact: !!production,
                cacheDirectory: !production,
                babelrc: false,
                configFile: false,
                presets: [require.resolve("@babel/preset-typescript")]
              }
            }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            production && {
              loader: require.resolve("infinite-loop-loader")
            }
          ].filter(Boolean)
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
