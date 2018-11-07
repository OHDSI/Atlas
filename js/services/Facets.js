define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const httpService = require('services/http');

	function getFacets(entityName) {
		return 	httpService.doGet(config.webAPIRoot + 'facets/' + entityName).catch(authApi.handleAccessDenied);
	}

	return {
		getFacets: getFacets,
	};
});
