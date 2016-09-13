define([], function () {
	var config = {};

	config.services = [
        {
			name: 'Local',
			url: 'http://localhost:8080/WebAPI/'
          }
        /*
        ,
		  {
			name: 'HixBeta Multihomed',
			url: 'http://hixbeta.jnj.com:8999/WebAPI/'
          }
        */
		];

	config.webAPIRoot = config.services[0].url;
	// config.rServicesHost = 'http://hixbeta.jnj.com:8999/';
	config.rServicesHost = 'http://rndusrdhit09.jnj.com:8080/';
	config.dataSourcesLocation = '/achilles/data/datasources.json';
	config.dataSourcesRoot = '/achilles/data';
  config.cohortComparisonResultsEnabled = false;
	
	return config;
});
