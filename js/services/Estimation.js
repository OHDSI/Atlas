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

	function exportEstimation(id) {
        return httpService
            .doGet(config.webAPIRoot + estimationEndpoint + id + "/export")
            .then(res => res.data);
	}

	function generate(id, source) {
		return httpService.doPost(config.webAPIRoot + estimationEndpoint + id + '/generation/' + source)
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}

	function listGenerations(id) {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint + id + '/generation')
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}

    function importEstimation(specification) {
        return httpService
            .doPost(config.webAPIRoot + estimationEndpoint + "import", specification)
            .then(res => res.data);
    }

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}${estimationEndpoint}${id}/exists?name=${name}`)
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}

    var api = {
		getEstimationList: getEstimationList,
		saveEstimation: saveEstimation,
		copyEstimation: copyEstimation,
		deleteEstimation: deleteEstimation,
		getEstimation: getEstimation,
		exportEstimation: exportEstimation,
		importEstimation: importEstimation,
		generate,
		listGenerations,
		exists,
	};

	return api;
});

