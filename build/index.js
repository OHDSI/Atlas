const ajaxRequest = require('ajax-request');
const settings = require('../js/settings');
const requirejs = require('requirejs');
const fs = require('fs');
const extras = require('fs-extra');

const baseOptimizationSettings = {
  ...settings,
  baseUrl: './js',
  paths: {
    'config-local': 'empty:',
    'css-builder': 'empty:',
  },
  excludeShallow: [],
  findNestedDependencies: false,
  optimize: 'uglify2',
};
const jsBundlePath = './js/assets/bundle/bundle.js';
const cssBundlePath = './js/assets/bundle/bundle.css';

function createCdnLibPath(name) {
  return `./assets/bundle/cdn-libs/${name}`;
}

function downloadLib(name, path, isJs) {
  const ext = isJs ? '.js' : '';
  console.log(`Downloading ${name} (${path}${ext})...`);
  return new Promise((resolve, reject) => {
    ajaxRequest.download({
      url: `${path}${ext}`,
      destPath: () => `./js/${createCdnLibPath(name)}${ext}`,
    }, (err, res, body, destpath) => {
      if (err) {        
        console.log(`Downloading of the ${name} failed!`, err);
        reject(err);
      } else {
        console.log(`${name} is downloaded`);
        resolve();
      }
    });
  });
}

function downloadLibs(aliasesMap, isJs = true) {
  const libs = [];
  const cdnLibs = [];
  const paths = {};
  Object.entries(aliasesMap).map(([name, path]) => {
    if (/^(components|modules)\//.test(path)) {
      return;
    }
    const isCdn = /^http(s?):\/\//.test(path);
    if (isCdn) {
      cdnLibs.push(downloadLib(name, path, isJs));
    }
    libs.push(name);
    paths[name] = isCdn ? createCdnLibPath(name) : path;
  });

  return {
    libs,
    cdnLibs,
    paths,
  };
}

function optimizeJs({ libs, cdnLibs, paths }) {
  const jsSettings = {
    ...baseOptimizationSettings,
    include: libs,
    paths: {
      ...paths,
      ...baseOptimizationSettings.paths,
    },
    out: jsBundlePath,
  };

  const promise = new Promise((resolve, reject) => {
    Promise.all(cdnLibs)
      .then(() => {
        console.log('');
        console.log('Optimizing JS bundle...');
        requirejs.optimize(
          jsSettings,
          () => {
            console.log('Success');
            resolve();
          },
          (er) => {
            console.error(er);
            reject();
          },
        );
      });
  });

  return promise;
}

function optimizeCss({ libs, cdnLibs, paths }) {  
  const promise = new Promise((resolve, reject) => {
    Promise.all(cdnLibs)
      .then(() => {
        console.log('');
        console.log('Optimizing CSS bundle...');
        const fileHandle = fs.createWriteStream(cssBundlePath);
        Object.values(paths).map(path => {
          const css = fs.readFileSync('js/' + path);
          fileHandle.write(css);
          fileHandle.write('\n');
        });
        fileHandle.end();
        console.log('Success');
        resolve();
      });
  });
}

function copyAssets() {
  console.log('');
  console.log('Copying assets...');
  extras.copySync('./js/images', './js/assets/images');
  extras.copySync('./js/fonts', './js/assets/fonts');
  console.log('Success');
}

optimizeJs(downloadLibs(settings.paths))
  .then(() => optimizeCss(downloadLibs(settings.cssPaths, false)))
  .then(copyAssets);
