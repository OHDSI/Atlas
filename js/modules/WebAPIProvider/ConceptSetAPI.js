define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');
	var sharedState = require('atlas-state');

	function getGenerationInfo(conceptSetId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/generationinfo',
			error: authApi.handleAccessDenied,
		});
		return infoPromise;
	}
	
		function deleteConceptSet(conceptSetId) {
		var promise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1') ,
			method: 'DELETE',
			contentType: 'application/json',
			error: authApi.handleAccessDenied,
		});
		return promise;
		}

	const api = {
		getGenerationInfo: getGenerationInfo, 
		deleteConceptSet: deleteConceptSet,
	};

	return api;
});