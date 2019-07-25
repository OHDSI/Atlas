define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	var authApi = require('services/AuthAPI');
	const httpService = require('services/http');

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
	
	function getAnalysis(id) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id}`)
			.then(parse)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});

		return promise;
	}
		
	function saveAnalysis(definition) {
		var definitionCopy = JSON.parse(ko.toJSON(definition));
		
		if (typeof definitionCopy.expression != 'string')
			definitionCopy.expression = JSON.stringify(definitionCopy.expression);
		
		const url = `${config.webAPIRoot}ir/${definitionCopy.id || ""}`;
		let promise = new Promise(r => r());
		if (definitionCopy.id) {
			promise = httpService.doPut(url, definitionCopy);
		} else {
			promise = httpService.doPost(url, definitionCopy);
		}

		return promise
			.then(parse)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
	}
	
	function copyAnalysis(id) {
		const promise = httpService.doGet(`${config.webAPIRoot}ir/${id || ""}/copy`);
		
		return promise
			.then(parse)
			.catch(response => {
				authApi.handleAccessDenied(response);
				return response;
			});
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
	};

	return api;
});