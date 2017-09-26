define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');

	function getPlpList() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'plp/',
			/*
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
			*/
			error: authApi.handleAccessDenied
		});
		return promise;
	}

	function savePlp(analysis) {
		var savePromise = $.ajax({
			url: config.webAPIRoot + 'plp/' + (analysis.analysisId || ""),
			method: analysis.analysisId ? 'PUT' : 'POST',
			/*
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
			*/
			contentType: 'application/json',
			data: JSON.stringify(analysis),
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return savePromise;
	}

	function copyPlp(id) {
		var copyPromise = $.ajax({
			url: config.webAPIRoot + 'plp/' + (id || "") + "/copy",
			method: 'GET',
			/*
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
			*/
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return copyPromise;
	}

	function deletePlp(id) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'plp/' + (id || ""),
			method: 'DELETE',
			/*
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
			*/
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return deletePromise;
	}

	function getPlp(id) {
		var loadPromise = $.ajax({
			url: config.webAPIRoot + 'plp/' + id,
			/*
						headers: {
							Authorization: authApi.getAuthorizationHeader()
						},
			*/
			error: function (error) {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			}
		});
		return loadPromise;
	}

	var api = {
		getPlpList: getPlpList,
		savePlp: savePlp,
		copyPlp: copyPlp,
		deletePlp: deletePlp,
		getPlp: getPlp,
	}

	return api;
});
