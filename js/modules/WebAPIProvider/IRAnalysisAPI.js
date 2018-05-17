define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');

	function pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}
	
	function getAnalysisList() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'ir/',
			error: authApi.handleAccessDenied,
		});
		return promise;
	}
	
	function getAnalysis(id) {
		var loadPromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + id,
			error: authApi.handleAccessDenied,
		}).then(function (result) {
			result.expression = JSON.parse(result.expression);
			loadPromise.resolve(result);
		});
		return loadPromise;	
	}
		
	function saveAnalysis(definition) {
		var definitionCopy = JSON.parse(ko.toJSON(definition))
		
		if (typeof definitionCopy.expression != 'string')
			definitionCopy.expression = JSON.stringify(definitionCopy.expression);
		
		var savePromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + (definitionCopy.id || ""),
			method: definitionCopy.id ? 'PUT' : 'POST',
			contentType: 'application/json',
			data: JSON.stringify(definitionCopy),
			error: authApi.handleAccessDenied,
		}).then(function (result) {
			result.expression = JSON.parse(result.expression);
			savePromise.resolve(result);
		});
		return savePromise;
	}
	
	function copyAnalysis(id) {
		var copyPromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + (id || "") +"/copy",
			method: 'GET',
			contentType: 'application/json',
			error: authApi.handleAccessDenied,
		}).then(function (result) {
			result.expression = JSON.parse(result.expression);
			copyPromise.resolve(result);
		});
		return copyPromise;	
	}	
	
	function deleteAnalysis(id) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || ""),
			method: 'DELETE',
			error: authApi.handleAccessDenied,
		});
		return deletePromise;
	}		
	
	function execute(id, sourceKey) {
		var executePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/execute/' + sourceKey,
			error: authApi.handleAccessDenied,
		});
		return executePromise;
	}
	
	function getInfo(id) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/info',
			error: authApi.handleAccessDenied,
		});
		return infoPromise;
	}
	
	
	function deleteInfo(id, sourceKey) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || "") + "/info/" + sourceKey,
			method: 'DELETE',
			error: authApi.handleAccessDenied,
		});
		return deletePromise;
	}		
	
	function getReport(id, sourceKey, targetId, outcomeId) {
		var reportPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/report/' + sourceKey + "?targetId=" + targetId + "&outcomeId=" + outcomeId,
			error: authApi.handleAccessDenied,
		});
		return reportPromise;
	}	
	
	var api = {
		getAnalysisList: getAnalysisList,
		getAnalysis: getAnalysis,
		saveAnalysis: saveAnalysis,
		copyAnalysis: copyAnalysis,
		deleteAnalysis: deleteAnalysis,
		execute: execute,
		getInfo: getInfo,
		deleteInfo: deleteInfo,
		getReport: getReport
	}

	return api;
});