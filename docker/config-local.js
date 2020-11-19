define([], function () {
	var configLocal = {};

	// WebAPI
	configLocal.api = {
		name: 'OHDSI',
		url: '${WEBAPI_URL}'
	};

	configLocal.cohortComparisonResultsEnabled = false;
	configLocal.userAuthenticationEnabled = false;
	configLocal.plpResultsEnabled = false;

	return configLocal;
});
