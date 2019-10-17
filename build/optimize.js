const babel = require("@babel/core");
const r = require("requirejs");
require('html-document/lib/global');
const projectSettings = require('../js/settings');

const bundleName = 'js/assets/bundle/bundle.js';

// shim for less plugin
window.less = {
	sheets: [],
	refresh: () => {},
	options: {
		logLevel: 0
	}
};

const settings = {
	...projectSettings,
	paths: {
		...projectSettings.paths,
		...projectSettings.localRefs,
	},
	include: ["../build/polyfill"],
	normalizeDirDefines: "skip",
	name: 'main',
	out: bundleName,
	onBuildRead(moduleName, path, content) {
		return babel.transform(content, {
				plugins: [ "@babel/plugin-proposal-object-rest-spread" ],
				presets: [ "@babel/preset-env" ],
			}
		).code;
	},
	findNestedDependencies: true,
	generateSourceMaps: false,
	optimize: "none",
};

r.optimize(settings);