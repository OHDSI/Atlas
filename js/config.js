define([
	'./config/app',
	'./config/terms-and-conditions',
	'optional!config-local',
	'optional!config-gis',
	'lodash',
], function (app, termsAndConditions, localConfig, gisConfig, lodash) {

	if (JSON.stringify(localConfig) == JSON.stringify({})) {
		console.warn('Local configuration not found.  Using default values. To use a local configuration and suppress 404 errors, create a file called config-local.js under the /js directory');
	}

	const configs = [app,
		termsAndConditions,
		localConfig,
		gisConfig, 
	]
	const config = configs.reduce((accumulator, currentValue) => _.mergeWith(accumulator, currentValue, customizer));

	function customizer(objValue, srcValue, key) {
		if (key === 'externalLibraries' && _.isArray(objValue)) {
			return objValue.concat(srcValue);
		}
		if (key === 'authProviders' && _.isArray(srcValue)) {
			return srcValue;
		}
	};

	config.webAPIRoot = config.api.url;

	return config;
});