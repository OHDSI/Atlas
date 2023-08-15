define(function (require, exports) {

	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const httpService = require('services/http');
	const estimationEndpoint = "estimation/"

	function getEstimationList() {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint).catch(authApi.handleAccessDenied);
	}

	async function saveEstimation(analysis) {
		const url = config.webAPIRoot + estimationEndpoint + (analysis.id || "");
		let result;
		if (analysis.id) {
			result = await httpService
				.doPut(url, analysis)
				.catch((error) => {
					console.log("Error: " + error);
					authApi.handleAccessDenied(error);
				})
		} else {
			result = authApi.executeWithRefresh(httpService
				.doPost(url, analysis)
				.catch((error) => {
					console.log("Error: " + error);
					authApi.handleAccessDenied(error);
				}))
		}
		return result;
	}

	async function copyEstimation(id) {
		return authApi.executeWithRefresh(httpService.doGet(config.webAPIRoot + estimationEndpoint + (id || "") + "/copy")
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
	}

	function deleteEstimation(id) {
		return httpService.doDelete(config.webAPIRoot + estimationEndpoint + (id || ""))
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	async function getEstimation(id) {
		return authApi.executeWithRefresh(httpService
			.doGet(config.webAPIRoot + estimationEndpoint + id)
			.catch((error) => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
	}

	function exportEstimation(id) {
        return httpService
            .doGet(config.webAPIRoot + estimationEndpoint + id + "/export")
            .then(res => res.data);
	}

	function generate(id, source) {
		return httpService.doPost(config.webAPIRoot + estimationEndpoint + id + '/generation/' + source)
			.then(res => res.data)
			.catch(error => {
				authApi.handleAccessDenied(error);
				if (error.status == 400) {
					alert((error && error.data && error.data.payload && error.data.payload.message) ? error.data.payload.message : 'Error occurred during analysis generion');
				}
			});
	}

	function listExecutions(id) {
		return httpService.doGet(config.webAPIRoot + estimationEndpoint + id + '/generation')
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}

	function importEstimation(specification) {
		return authApi.executeWithRefresh(httpService
					.doPost(config.webAPIRoot + estimationEndpoint + "import", specification)
					.then(res => res.data));
	}

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}${estimationEndpoint}${id}/exists?name=${name}`)
			.then(res => res.data)
			.catch(error => authApi.handleAccessDenied(error));
	}

	function runDiagnostics(design) {
		return httpService
			.doPost(`${config.webAPIRoot}${estimationEndpoint}check`, design)
			.then(res => res.data);
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
		listExecutions,
		exists,
		runDiagnostics,
	};

	return api;
});

