const path = require("path");
const os = require("os");
const ts = require("typescript");

const formatDiagnosticHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => os.EOL
};

function getTsConfig(basedir) {
  const { config, error } = ts.readConfigFile(
    path.join(basedir, "tsconfig.json"),
    ts.sys.readFile
  );

  if (error) {
    throw new Error(ts.formatDiagnostic(error, formatDiagnosticHost));
  }

  return config;
}

module.exports = getTsConfig;
