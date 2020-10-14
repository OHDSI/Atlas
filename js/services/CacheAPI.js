define(function(require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const httpService = require('services/http');

	function clearCache() {
		return httpService.doGet(config.webAPIRoot + 'cache/clear')
			.then(res => res.data)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	return {
		clearCache,
	};
});