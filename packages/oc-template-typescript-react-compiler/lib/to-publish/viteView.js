const fs = require('fs-extra');
const vite = require('vite');
const path = require('path');
const EnvironmentPlugin = require('vite-plugin-environment').default;
const hashBuilder = require('oc-hash-builder');
const ocViewWrapper = require('oc-view-wrapper');
const { callbackify } = require('util');
const cssModules = require('./cssModulesPlugin');

const clientName = 'clientBundle';

const partition = (array, predicate) => {
  const matches = [];
  const rest = [];
  for (const element of array) {
    if (predicate(element)) {
      matches.push(element);
    } else {
      rest.push(element);
    }
  }
  return [matches, rest];
};

async function compileView(options) {
  function processRelativePath(relativePath) {
    let pathStr = path.join(options.componentPath, relativePath);
    if (process.platform === 'win32') {
      return pathStr.split('\\').join('\\\\');
    }
    return pathStr;
  }

  const staticFiles = options.componentPackage.oc.files.static;
  const staticFolder = Array.isArray(staticFiles) ? staticFiles[0] : staticFiles;
  const viewFileName = options.componentPackage.oc.files.template.src;
  const componentPath = options.componentPath;
  const viewPath = processRelativePath(viewFileName);

  const publishPath = options.publishPath;
  const tempPath = path.join(publishPath, 'temp');
  const publishFileName = options.publishFileName || 'template.js';
  const componentPackage = options.componentPackage;
  const externals = options.externals || [];
  const production = !!options.production;
  const viewExtension = viewFileName.match(/\.\w{1,5}$/)?.[0] ?? '.js';

  const viewWrapperContent = options.viewWrapper({ viewPath });
  const viewWrapperName = `_viewWrapperEntry${viewExtension}`;
  const viewWrapperPAth = path.join(tempPath, viewWrapperName);

  await fs.outputFile(viewWrapperPAth, viewWrapperContent);

  const globals = externals.reduce((externals, dep) => {
    externals[dep.name] = dep.global;
    return externals;
  }, {});

  const result = await vite.build({
    appType: 'custom',
    root: componentPath,
    mode: production ? 'production' : 'development',
    plugins: [...options.plugins, EnvironmentPlugin(['NODE_ENV']), cssModules()],
    logLevel: 'silent',
    build: {
      sourcemap: !production,
      lib: { entry: viewWrapperPAth, formats: ['iife'], name: clientName },
      write: false,
      minify: production,
      rollupOptions: {
        external: Object.keys(globals),
        output: {
          globals
        }
      }
    }
  });
  const out = Array.isArray(result) ? result[0] : result;
  const bundle = out.output.find((x) => x.facadeModuleId.endsWith(viewWrapperName)).code;
  const [cssAssets, otherAssets] = partition(
    out.output.filter((x) => x.type === 'asset'),
    (x) => x.fileName.endsWith('.css')
  );
  const cssStyles = cssAssets.map((x) => x.source.replace(/\r?\n/g, '') ?? '').join(' ').replace(/'/g, '"');
  const bundleHash = hashBuilder.fromString(bundle);
  const wrappedBundle = `(function() {
    ${bundle}

    return ${clientName};
  })()`;

  const shortTemplateType = options.componentPackage.oc.files.template.type
    .replace('oc-template-', '')
    .replace(/-/, '');
  const templateId = `oc-${shortTemplateType}Root-${componentPackage.name}`;
  const templateString = options.htmlTemplate({
    templateId,
    css: cssStyles,
    externals,
    bundle: wrappedBundle,
    hash: bundleHash
  });
  const templateStringCompressed = production
    ? templateString.replace(/\s+/g, ' ')
    : templateString;
  const hash = hashBuilder.fromString(templateStringCompressed);
  const view = ocViewWrapper(hash, templateStringCompressed);

  await fs.unlink(viewWrapperPAth);
  await fs.mkdir(publishPath, { recursive: true });
  await fs.writeFile(path.join(publishPath, publishFileName), view);
  if (staticFolder) {
    for (const asset of otherAssets) {
      // asset.fileName could have paths like assets/file.js
      // so we need to create those extra directories
      await fs.ensureFile(path.join(publishPath, staticFolder, asset.fileName));
      await fs.writeFile(
        path.join(publishPath, staticFolder, asset.fileName),
        asset.source,
        'utf-8'
      );
    }
  }

  return {
    template: {
      type: options.componentPackage.oc.files.template.type,
      hashKey: hash,
      src: publishFileName
    }
  };
}

module.exports = callbackify(compileView);
