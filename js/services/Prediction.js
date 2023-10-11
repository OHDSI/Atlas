define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
    const httpService = require('services/http');
    const predictionEndpoint = "prediction/"

	function getPredictionList() {
		return httpService.doGet(config.webAPIRoot + predictionEndpoint).catch(authApi.handleAccessDenied);
	}

	async function savePrediction(analysis) {
		const url = config.webAPIRoot + predictionEndpoint + (analysis.id || "");
		let result;
		if (analysis.id) {
			result = await httpService.doPut(url, analysis).catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
		} else {
			result = authApi.executeWithRefresh(httpService.doPost(url, analysis).catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
		}

		return result;
	}

	function copyPrediction(id) {
		return authApi.executeWithRefresh(httpService.doGet(config.webAPIRoot + predictionEndpoint + (id || "") + "/copy")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
	}

	function deletePrediction(id) {
		return httpService.doDelete(config.webAPIRoot + predictionEndpoint + (id || ""))
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function getPrediction(id) {
		return authApi.executeWithRefresh(httpService.doGet(config.webAPIRoot + predictionEndpoint + id)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
	}

	function exportPrediction(id) {
        return httpService
            .doGet(config.webAPIRoot + predictionEndpoint + id + "/export")
            .then(res => res.data);
	}

	function generate(id, source) {
    	return httpService.doPost(config.webAPIRoot + predictionEndpoint + id + '/generation/' + source)
				.then(res => res.data)
				.catch(error => {
					authApi.handleAccessDenied(error);
					if (error.status == 400) {
						alert((error && error.data && error.data.payload && error.data.payload.message) ? error.data.payload.message : 'Error occurred during analysis generion');
					}
				});
	}

	function listExecutions(id) {
    	return httpService.doGet(config.webAPIRoot + predictionEndpoint + id + '/generation')
				.then(res => res.data)
				.catch(error => authApi.handleAccessDenied(error));
	}

	async function importPrediction(specification) {
			return authApi.executeWithRefresh(httpService
					.doPost(config.webAPIRoot + predictionEndpoint + "import", specification)
					.then(res => res.data));
	}

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}${predictionEndpoint}${id}/exists?name=${name}`)
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}
 
	function runDiagnostics(design) {
		return httpService
			.doPost(`${config.webAPIRoot}${predictionEndpoint}check`, design)
			.then(res => res.data);
	}


	return {
		getPredictionList: getPredictionList,
		savePrediction: savePrediction,
		copyPrediction: copyPrediction,
		deletePrediction: deletePrediction,
		getPrediction: getPrediction,
		exportPrediction: exportPrediction,
		importPrediction: importPrediction,
		generate,
		listExecutions,
		exists,
		runDiagnostics,
	};
});

