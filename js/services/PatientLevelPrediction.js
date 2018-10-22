define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const httpService = require('services/http');

	function getPlpList() {
		return httpService.doGet(config.webAPIRoot + 'plp/').catch(authApi.handleAccessDenied);
	}

	function savePlp(analysis) {
		const url = config.webAPIRoot + 'plp/' + (analysis.analysisId || "");
		let promise;
		if (analysis.analysisId) {
			promise = httpService.doPut(url, analysis);
		} else {
			promise = httpService.doPost(url, analysis);
		}
		promise.catch((error) => {
			console.log("Error: " + error);
			authApi.handleAccessDenied(error);
		});

		return promise;
	}

	function copyPlp(id) {
		return httpService.doGet(config.webAPIRoot + 'plp/' + (id || "") + "/copy")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function deletePlp(id) {
		return httpService.doDelete(config.webAPIRoot + 'plp/' + (id || ""))
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function getPlp(id) {
		return httpService.doGet(config.webAPIRoot + 'plp/' + id)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	var api = {
		getPlpList: getPlpList,
		savePlp: savePlp,
		copyPlp: copyPlp,
		deletePlp: deletePlp,
		getPlp: getPlp,
	};

	return api;
});
