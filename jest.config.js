const path = require('path');
const requirejs = require('requirejs');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
};

requirejs.config({
  baseUrl: path.resolve(__dirname, 'js'),
  nodeRequire: require,
});

globalThis.requirejsInstance = requirejs;
globalThis.requireAmd = (deps) =>
  new Promise((resolve, reject) => {
    requirejs(
      deps,
      (...mods) => resolve(mods.length === 1 ? mods[0] : mods),
      reject
    );
  });
