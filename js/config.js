define(['optional!config-local'], function (localConfig) {
	var config = {};

	// default configuration
	config.services = [{
		name: 'Local',
		url: 'http://localhost:8080/WebAPI/'
	}];
	config.cohortComparisonResultsEnabled = false;
	config.userAuthenticationEnabled = false;

	Object.assign(config, localConfig);
	config.webAPIRoot = config.services[0].url;
	return config;
});
