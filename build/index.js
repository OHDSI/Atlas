const ajaxRequest = require('ajax-request');
let settings = require('../js/settings');
const requirejs = require('requirejs');

function createCdnLibPath(name) {
  return `./assets/bundle/cdn-libs/${name}`;
}

function downloadLib(name, path) {
  console.log(`Downloading ${name} (${path}.js)...`);
  return new Promise((resolve, reject) => {
    ajaxRequest.download({
      url: `${path}.js`,
      destPath: () => `./js/${createCdnLibPath(name)}.js`,
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

const libs = [];
const cdnLibs = [];
const paths = {};
Object.entries(settings.paths).map(([name, path]) => {
  if (/^(components|modules)\//.test(path)) {
    return;
  }
  const isCdn = /^http(s?):\/\//.test(path);
  if (isCdn) {
    cdnLibs.push(downloadLib(name, path));
  }
  libs.push(name);
  paths[name] = isCdn ? createCdnLibPath(name) : path;
});

settings = {
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
  out: './js/assets/bundle/bundle.js',
  optimize: 'uglify2',
};

Promise.all(cdnLibs)
  .then(() => {
    console.log('Optimizing bundle...');
    requirejs.optimize(settings, () => console.log('success'), (er) => console.error(er));
  });
