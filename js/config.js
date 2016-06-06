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

	config.dataSourcesLocation = '/achilles/data/datasources.json';
	config.dataSourcesRoot = '/achilles/data';
	
	return config;
});
