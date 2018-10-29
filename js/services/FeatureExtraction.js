define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const httpService = require('services/http');

	function getDefaultCovariateSettings(temporal = false) {
		return httpService.doGet(config.webAPIRoot + 'featureextraction/defaultcovariatesettings?temporal=' + temporal).catch(authApi.handleAccessDenied);
	}

	var api = {
		getDefaultCovariateSettings: getDefaultCovariateSettings,
	};

	return api;
});
