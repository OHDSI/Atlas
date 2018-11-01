const babel = require("@babel/core");
const r = require("requirejs");
const projectSettings = require('../js/settings');

const settings = {
	...projectSettings,
	normalizeDirDefines: "skip",
	name: 'main',
	out: 'js/assets/bundle/bundle.js',
	onBuildRead(moduleName, path, content) {
		return babel.transform(
      content, { plugins: ["@babel/plugin-proposal-object-rest-spread"] }
    ).code;
  },
	// deps: Object.values(projectSettings.paths),
	findNestedDependencies: true,
};

r.optimize(settings);