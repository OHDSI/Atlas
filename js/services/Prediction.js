define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
    const httpService = require('services/http');
    const predictionEndpoint = "prediction/"

	function getPredictionList() {
		return httpService.doGet(config.webAPIRoot + predictionEndpoint).catch(authApi.handleAccessDenied);
	}

	function savePrediction(analysis) {
		const url = config.webAPIRoot + predictionEndpoint + (analysis.id || "");
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

	function copyPrediction(id) {
		return httpService.doGet(config.webAPIRoot + predictionEndpoint + (id || "") + "/copy")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function deletePrediction(id) {
		return httpService.doDelete(config.webAPIRoot + predictionEndpoint + (id || ""))
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function getPrediction(id) {
		return httpService.doGet(config.webAPIRoot + predictionEndpoint + id)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function exportPrediction(id) {
        return httpService
            .doGet(config.webAPIRoot + predictionEndpoint + id + "/export")
            .then(res => res.data);
	}

	function generate(id, source) {
    	return httpService.doPost(config.webAPIRoot + predictionEndpoint + id + '/generation/' + source)
				.then(res => res.data)
				.catch(error => authApi.handleAccessDenied(error));
	}

	function listGenerations(id) {
    	return httpService.doGet(config.webAPIRoot + predictionEndpoint + id + '/generation')
				.then(res => res.data)
				.catch(error => authApi.handleAccessDenied(error));
	}

    function importPrediction(specification) {
        return httpService
            .doPost(config.webAPIRoot + predictionEndpoint + "import", specification)
            .then(res => res.data);
    }

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}${predictionEndpoint}${id}/exists?name=${name}`)
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}


    var api = {
		getPredictionList: getPredictionList,
		savePrediction: savePrediction,
		copyPrediction: copyPrediction,
		deletePrediction: deletePrediction,
		getPrediction: getPrediction,
		exportPrediction: exportPrediction,
		importPrediction: importPrediction,
		generate,
		listGenerations,
		exists,
	};

	return api;
});

