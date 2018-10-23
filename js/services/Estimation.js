define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
    const httpService = require('services/http');
    const estimationEndpoint = "estimation/"

	function getEstimationList() {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint).catch(authApi.handleAccessDenied);
	}

	function saveEstimation(analysis) {
		const url = config.webAPIRoot + estimationEndpoint + (analysis.id || "");
		let promise;
		if (analysis.id) {
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

	function copyEstimation(id) {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint + (id || "") + "/copy")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function deleteEstimation(id) {
		return httpService.doDelete(config.webAPIRoot + estimationEndpoint + (id || ""))
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function getEstimation(id) {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint + id)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function exportFullSpecification(id) {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint + id + "/export")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

    var api = {
		getEstimationList: getEstimationList,
		saveEstimation: saveEstimation,
		copyEstimation: copyEstimation,
		deleteEstimation: deleteEstimation,
		getEstimation: getEstimation,
		exportFullSpecification: exportFullSpecification,
	};

	return api;
});

