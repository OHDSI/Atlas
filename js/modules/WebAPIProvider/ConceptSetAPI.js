define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
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

  function exists(name, id) {
    return $.ajax({
      url: config.webAPIRoot + 'conceptset/exists',
			data: {
      	name,
				id,
			},
			method: 'GET',
			error: authApi.handleAccessDenied,
    });
  }

  function saveConceptSet(conceptSet) {
		var json = ko.toJSON(conceptSet);
		return $.ajax({
      method: conceptSet.id ? 'PUT' : 'POST',
      url: config.api.url + 'conceptset/' + (conceptSet.id || ''),
      contentType: 'application/json',
      data: json,
      dataType: 'json',
      error: authApi.handleAccessDenied,
		});
	}

	function saveConceptSetItems(id, conceptSetItems) {
		return $.ajax({
      method: 'PUT',
      url: config.api.url + 'conceptset/' + id + '/items',
      data: JSON.stringify(conceptSetItems),
      dataType: 'json',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
		});
	}

	function getConceptSet(conceptSetId) {
		var promise = $.ajax({
			url: config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1') ,
			method: 'GET',
			contentType: 'application/json',
			error: authApi.handleAccessDenied,
		});
		return promise;
  }
    
  var api = {
		getConceptSet: getConceptSet,
		getGenerationInfo: getGenerationInfo,
		deleteConceptSet: deleteConceptSet,
		exists: exists,
		saveConceptSet,
		saveConceptSetItems,
	};

	return api;
});