define([], function () {
	var configLocal = {};

	// WebAPI
	configLocal.api = {
		name: 'OHDSI',
		url: 'http://localhost:8080/WebAPI/'
	};

	configLocal.cohortComparisonResultsEnabled = false;
	configLocal.userAuthenticationEnabled = false;
	configLocal.plpResultsEnabled = false;

	return configLocal;
});
