define([], function () {
	var config = {};

	config.services = [
		{
			name: 'HixBeta Multihomed',
			url: 'http://hixbeta.jnj.com:8081/WebAPI/'
			},
		{
			name: 'Local',
			url: 'http://localhost:8080/WebAPI/'
			}
		];

	config.webAPIRoot = config.services[0].url;

	return config;

});