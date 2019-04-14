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
	
	function getCohortDefinitionList() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/',
			error: authApi.handleAccessDenied
		});
		return promise;
	}
	
	function saveCohortDefinition(definition) {
		var savePromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (definition.id || ""),
			method: definition.id ? 'PUT' : 'POST',
			contentType: 'application/json',
			data: JSON.stringify(definition),
			error: function(error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
	    });
		return savePromise;
	}
	
	function copyCohortDefinition(id) {
		var copyPromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (id || "") +"/copy",
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return copyPromise;
	}	
	
	function deleteCohortDefinition(id) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (id || ""),
			method: 'DELETE'
		});
		return deletePromise;
	}	
	
	function getCohortDefinition(id) {
		var loadPromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + id,
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return loadPromise;
	}

	function exists(name, id) {
		return httpService
			.doGet(`${config.webAPIRoot}cohortdefinition/${id}/exists?name=${name}`)
			.then(res => res.data);
	}
	
	function getSql(expression, options) {
		var getSqlPromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/sql',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				expression: expression,
				options: options
			}),
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});	
		return getSqlPromise;
	}

	function translateSql(sql, dialect) {
		return httpService.doPost(config.webAPIRoot + 'sqlrender/translate', ko.toJS({
			SQL: sql,
			targetdialect: dialect
		}))
			.catch(error => console.log("Error: " + error));
	}


	function generate(cohortDefinitionId, sourceKey, includeFeatures) {
		var route = config.webAPIRoot + 'cohortdefinition/' + cohortDefinitionId + '/generate/' + sourceKey;
		if (includeFeatures) {
			route = `${route}?includeFeatures`;
		}
		return httpService.doGet(route);
	}


	function cancelGenerate(cohortDefinitionId, sourceKey) {
    return $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (cohortDefinitionId || '-1') + '/cancel/' + sourceKey,
			error: authApi.handleAccessDenied,
		});
	}

	function getInfo(cohortDefinitionId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (cohortDefinitionId || '-1') + '/info',
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return infoPromise;
	}
	
	function getReport(cohortDefinitionId, sourceKey, modeId) {
		var reportPromise = $.ajax({
			url: `${config.webAPIRoot}cohortdefinition/${(cohortDefinitionId || '-1')}/report/${sourceKey}?mode=${modeId || 0}`,
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return reportPromise;
	}

	function getWarnings(cohortDefinitionId) {
		return $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (cohortDefinitionId || '-1') + '/check',
			error: authApi.handleAccessDenied,
		});
	}

	function runDiagnostics(id, expression) {
		return $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (id || '-1') + '/check',
			contentType: 'application/json',
			method: 'POST',
			data: expression,
			error: authApi.handleAccessDenied,
		});
	}

	function getCohortCount(sourceKey, cohortDefinitionId) {
		return httpService.doGet(config.api.url + 'cohortresults/' + sourceKey + '/' + cohortDefinitionId + '/distinctPersonCount')
			.then(({ data }) => data);
	}

	function getCohortAnalyses(cohortJob) {
		return httpService.doPost(config.api.url + 'cohortanalysis', cohortJob);
	}

	var api = {
		getCohortDefinitionList: getCohortDefinitionList,
		saveCohortDefinition: saveCohortDefinition,
		copyCohortDefinition: copyCohortDefinition,
		deleteCohortDefinition: deleteCohortDefinition,
		getCohortDefinition: getCohortDefinition,
		getSql: getSql,
		translateSql: translateSql,
		generate: generate,
		getInfo: getInfo,
		getReport: getReport,
		getWarnings: getWarnings,
		runDiagnostics: runDiagnostics,
		cancelGenerate,
		getCohortCount,
		getCohortAnalyses: getCohortAnalyses,
		exists: exists,
	};

	return api;
});
