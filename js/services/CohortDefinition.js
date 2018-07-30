define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');
	
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
			method: 'DELETE',
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
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
	
	function generate(cohortDefinitionId, sourceKey) {
		var generatePromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (cohortDefinitionId || '-1') + '/generate/' + sourceKey,
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return generatePromise;
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
	
	var api = {
		getCohortDefinitionList: getCohortDefinitionList,
		saveCohortDefinition: saveCohortDefinition,
		copyCohortDefinition: copyCohortDefinition,
		deleteCohortDefinition: deleteCohortDefinition,
		getCohortDefinition: getCohortDefinition,
		getSql: getSql,
		generate: generate,
		getInfo: getInfo,
		getReport: getReport,
		getWarnings: getWarnings,
		runDiagnostics: runDiagnostics,
		cancelGenerate,
	}

	return api;
});
