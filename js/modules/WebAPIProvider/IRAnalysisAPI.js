define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	
	function pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}
	
	function getAnalysisList() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'ir/'
		});
		return promise;
	}
	
	function getAnalysis(id) {
		var loadPromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + id,
			error: function (error) {
				console.log("Error: " + error);
			}
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
			method: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify(definitionCopy),
			error: function (error) {
				console.log("Error: " + error);
			}
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
			error: function (error) {
				console.log("Error: " + error);
			}
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
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return deletePromise;
	}		
	
	function execute(id, sourceKey) {
		var executePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/execute/' + sourceKey,
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return executePromise;
	}
	
	function getInfo(id) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/info',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return infoPromise;
	}
	
	
	function deleteInfo(id, sourceKey) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || "") + "/info/" + sourceKey,
			method: 'DELETE',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return deletePromise;
	}		
	
	function getReport(id, sourceKey, targetId, outcomeId) {
		var reportPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || '-1') + '/report/' + sourceKey + "?targetId=" + targetId + "&outcomeId=" + outcomeId,
			error: function (error) {
				console.log("Error: " + error);
			}
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