define([], function () {
	var config = {};

	config.services = [
        /*
        {
			name: 'Local',
			url: 'http://localhost:8080/WebAPI/'
          },
        */
		  {
			name: 'HixBeta Multihomed',
			url: 'http://hixbeta.jnj.com:8999/WebAPI/'
          }
		];

	config.webAPIRoot = config.services[0].url;

	config.dataSourcesLocation = 'http://hix.jnj.com/achilles/data/datasources.json';
  config.dataSourcesRoot = 'http://hix.jnj.com/achilles/data';
	
	return config;

});