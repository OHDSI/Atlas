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

	async function saveCohortDefinition(definition) {
		return authApi.executeWithRefresh($.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (definition.id || ""),
			method: definition.id ? 'PUT' : 'POST',
			contentType: 'application/json',
			data: JSON.stringify(definition),
			error: function(error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
	  }));
	}

	async function copyCohortDefinition(id) {
		return authApi.executeWithRefresh($.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (id || "") +"/copy",
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		}));
	}

	function deleteCohortDefinition(id) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (id || ""),
			method: 'DELETE'
		});
		return deletePromise;
	}

	async function getCohortDefinition(id) {
		return authApi.executeWithRefresh(httpService
			.doGet(config.webAPIRoot + 'cohortdefinition/' + id)
			.then(res => {
				const cohortDef = res.data;
				cohortDef.expression = JSON.parse(cohortDef.expression);
				return cohortDef;
			}).catch(error => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}));
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


	function generate(cohortDefinitionId, sourceKey) {
		return httpService.doGet(`${config.webAPIRoot}cohortdefinition/${cohortDefinitionId}/generate/${sourceKey}`);
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

	function runDiagnostics(expression) {
		return httpService.doPost(config.webAPIRoot + 'cohortdefinition/checkV2', expression)
			.then(res => res.data);
	}

	function getCohortCount(sourceKey, cohortDefinitionId) {
		return httpService.doGet(config.api.url + 'cohortresults/' + sourceKey + '/' + cohortDefinitionId + '/distinctPersonCount')
			.then(({ data }) => data);
	}

	function getCohortAnalyses(cohortJob) {
		return httpService.doPost(config.api.url + 'cohortanalysis', cohortJob);
	}

	function getCohortPrintFriendly(cohortExpression) {
		return httpService.plainTextService.doPost(config.webAPIRoot + 'cohortdefinition/printfriendly/cohort?format=html', cohortExpression);
	}

	function getVersions(cohortDefinitionId) {
		return httpService.doGet(`${config.webAPIRoot}cohortdefinition/${cohortDefinitionId}/version/`)
			.then(({ data }) => data);
	}

	function getVersion(cohortDefinitionId, versionNumber) {
		return httpService.doGet(`${config.webAPIRoot}cohortdefinition/${cohortDefinitionId}/version/${versionNumber}`)
			.then(res => {
				const cohortDef = res.data.entityDTO;
				cohortDef.expression = JSON.parse(cohortDef.expression);
				cohortDef.versionDef = res.data.versionDTO;
				return cohortDef;
			}).catch(error => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function copyVersion(cohortDefinitionId, versionNumber) {
		return authApi.executeWithRefresh(httpService
			.doPut(`${config.webAPIRoot}cohortdefinition/${cohortDefinitionId}/version/${versionNumber}/createAsset`)
			.then(({ data }) => data));
	}

	function updateVersion(version) {
		return httpService.doPut(`${config.webAPIRoot}cohortdefinition/${version.assetId}/version/${version.version}`, {
			comment: version.comment,
			archived: version.archived
		}).then(({ data }) => data);
	}

	var api = {
		getCohortDefinitionList,
		saveCohortDefinition,
		copyCohortDefinition,
		deleteCohortDefinition,
		getCohortDefinition,
		getSql,
		translateSql,
		generate,
		getInfo,
		getReport,
		runDiagnostics,
		cancelGenerate,
		getCohortCount,
		getCohortAnalyses,
		exists: exists,
		getCohortPrintFriendly,
		getVersions,
		getVersion,
		updateVersion,
		copyVersion
	};

	return api;
});
