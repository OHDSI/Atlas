const ajaxRequest = require('ajax-request');
let settings = require('../js/settings');
const requirejs = require('requirejs');
const fs = require('fs');

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

function optimizeJs() {
  const { libs, cdnLibs, paths } = downloadLibs(settings.paths);
  const jsSettings = {
    ...settings,
    baseUrl: './js',
    include: libs,
    paths: {
      ...paths,
      'config-local': 'empty:',
      'css-builder': 'empty:',
    },
    excludeShallow: [],
    findNestedDependencies: false,
    out: jsBundlePath,
    optimize: 'uglify2',
  };

  const promise = new Promise((resolve, reject) => {
    Promise.all(cdnLibs)
      .then(() => {
        console.log('Optimizing JS bundle...');
        requirejs.optimize(
          jsSettings,
          () => {
            console.log('success');
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

function optimizeCss() {
  const { libs, cdnLibs, paths } = downloadLibs(settings.cssPaths, false);
  Promise.all(cdnLibs)
    .then(() => {
      console.log('Optimizing CSS bundle...');
      const fileHandle = fs.createWriteStream(cssBundlePath);
      Object.values(paths).map(path => {
        const css = fs.readFileSync('js/' + path);
        fileHandle.write(css);
        fileHandle.write('\n');
      });
      console.log('Success');
      fileHandle.end();
    });
}

optimizeJs().then(optimizeCss);
