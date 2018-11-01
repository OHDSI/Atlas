define([
	'./config/app',
	'./config/terms-and-conditions',
	'config-local'
], function (app, termsAndConditions, localConfig) {

	if (JSON.stringify(localConfig) == JSON.stringify({})) {
		console.warn('Local configuration not found.  Using default values. To use a local configuration and suppress 404 errors, create a file called config/local.config.js under the /js directory');
	}

	let config = Object.assign(
		{},
		app,
		termsAndConditions,
		localConfig
	);

	config.webAPIRoot = config.api.url;

	return config;
	
});
