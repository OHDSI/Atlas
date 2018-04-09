define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');

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

  function exists(name) {
    return $.ajax({
      url: config.webAPIRoot + 'conceptset/exists',
			data: {
      	name,
			},
			method: 'GET',
			error: authApi.handleAccessDenied,
    });
  }

  var api = {
		getGenerationInfo: getGenerationInfo,
		deleteConceptSet: deleteConceptSet,
		exists: exists,
	};

	return api;
});