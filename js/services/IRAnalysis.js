define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	var authApi = require('services/AuthAPI');
	const httpService = require('services/http');
	const fileService = require('services/file');

	function pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}

	function parse({ data }) {
		return Object.assign(data, {
			expression: JSON.parse(data.expression),
		});
	}
	
	function getAnalysisList() {
		const promise = httpService.doGet(`${config.webAPIRoot}ir`);
		promise.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			}
		);

		return promise;
	}
	
	async function getAnalysis(id) {
		return authApi.executeWithRefresh(httpService.doGet(`${config.webAPIRoot}ir/${id}`)
			.then(parse)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			}));
	}
		
	async function saveAnalysis(definition) {
		var definitionCopy = JSON.parse(ko.toJSON(definition));
		
		if (typeof definitionCopy.expression != 'string')
			definitionCopy.expression = JSON.stringify(definitionCopy.expression);
		
		const url = `${config.webAPIRoot}ir/${definitionCopy.id || ""}`;
		let result;
		if (definitionCopy.id) {
			result = await httpService
				.doPut(url, definitionCopy)
				.catch(response => {
					authApi.handleAccessDenied(response);
					return response;
				})
				.then(parse);
		} else {
			result = authApi.executeWithRefresh(httpService
				.doPost(url, definitionCopy)
				.catch(response => {
					authApi.handleAccessDenied(response);
					return response;
				})
				.then(parse));
		}

		return result;

	}
	
	async function copyAnalysis(id) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id || ""}/copy`);
		
		return authApi.executeWithRefresh(promise
			.then(parse)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			}));
	}	
	
	function deleteAnalysis(id) {
		const promise = httpService.doDelete(`${config.webAPIRoot}ir/${id || ""}`);
		
		return promise
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}		
	
	function execute(id, sourceKey) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id || ""}/execute/${sourceKey}`);
		
		return promise
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}

	function cancelExecution(id, sourceKey) {
		const promise = httpService.doDelete(`${config.webAPIRoot}ir/${id || ""}/execute/${sourceKey}`);

		return promise
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}

	const errorHandler = response => {
		if (response.status === 404) {
			throw new Error("Not found entity");
		}
		authApi.handleAccessDenied(response);
		return response;
	};
	
	function getInfo(id) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id || ""}/info`);
		
		return promise
			.then(({ data }) => data)
			.catch(errorHandler);
	}

	function loadResultsSummary(id, sourceKey) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id}/info/${sourceKey}`);

		return promise
			.then(({data}) => data)
			.catch(errorHandler);
	}
	
	function deleteInfo(id, sourceKey) {
		const promise = httpService.doDelete(`${config.webAPIRoot}ir/${id || ""}/info/${sourceKey}`);
		
		return promise
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}		
	
	function getReport(id, sourceKey, targetId, outcomeId) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id || ""}/report/${sourceKey}?targetId=${targetId}&outcomeId=${outcomeId}`);
		
		return promise
			.then(({ data }) => data)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}ir/${id}/exists?name=${name}`)
			.then(res => res.data)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}

	function importAnalysis(definition) {
		return httpService
			.doPost(`${config.webAPIRoot}ir/design`, definition)
			.then(res => res.data)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
    }

	function exportAnalysis(id) {
		return httpService
			.doGet(config.webAPIRoot + `ir/${id}/design`)
			.then(res => res.data)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
    }

   function exportSql({ analysisId, expression } = {}) {
			return httpService
				.doPost(`${config.webAPIRoot}ir/sql`, { analysisId, expression })
				.then(res => res.data)
				.catch(response => {
					authApi.handleAccessDenied(response);
					return response;
				});
	 }

	 function exportConceptSets(id) {
		return fileService.loadZip(`${config.webAPIRoot}ir/${id}/export/conceptset`);
	}

	function runDiagnostics(design) {
		var designCopy = JSON.parse(ko.toJSON(design));

		if (typeof designCopy.expression != 'string') {
			designCopy.expression = JSON.stringify(designCopy.expression);
		}

		return httpService
			.doPost(`${config.webAPIRoot}ir/check`, designCopy)
			.then(res => res.data);
	}

	function getVersions(id) {
		return httpService.doGet(`${config.webAPIRoot}ir/${id}/version/`)
			.then(res => res.data);
	}

	function getVersion(id, versionNumber) {
		return httpService.doGet(`${config.webAPIRoot}ir/${id}/version/${versionNumber}`)
			.then(res => res.data);
	}

	function copyVersion(id, versionNumber) {
		return httpService.doPut(`${config.webAPIRoot}ir/${id}/version/${versionNumber}/createAsset`)
			.then(res => res.data);
	}

	function updateVersion(version) {
		return httpService.doPut(`${config.webAPIRoot}ir/${version.assetId}/version/${version.version}`, {
			comment: version.comment,
			archived: version.archived
		}).then(res => res.data);
	}

	var api = {
		getAnalysisList: getAnalysisList,
		getAnalysis: getAnalysis,
		saveAnalysis: saveAnalysis,
		copyAnalysis: copyAnalysis,
		deleteAnalysis: deleteAnalysis,
		execute: execute,
		cancelExecution: cancelExecution,
		getInfo: getInfo,
		deleteInfo: deleteInfo,
		getReport: getReport,
		loadResultsSummary,
		exists,
		importAnalysis: importAnalysis,
		exportAnalysis: exportAnalysis,
		exportSql,
		exportConceptSets,
		runDiagnostics,
		getVersions,
		getVersion,
		updateVersion,
		copyVersion
	};

	return api;
});