define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	var authApi = require('webapi/AuthAPI');
	var sharedState = require('atlas-state')

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

  function getConceptSetExpression(conceptSetId) {
		return $.ajax({
			url: config.webAPIRoot + 'conceptset/' + conceptSetId + '/expression',
			method: 'GET',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
		});
	}

  function resolveConceptSetExpression(conceptSetExpression, page) {
    return $.ajax({
      url: sharedState.vocabularyUrl() + 'resolveConceptSetExpression' + (page ? 'Page' : ''),
      data: conceptSetExpression,
      method: 'POST',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
    });
	}

  function includedConceptSetCount(expression) {
		return $.ajax({
      url: sharedState.vocabularyUrl() + 'included-concepts/count',
      data: expression,
      method: 'POST',
      contentType: 'application/json',
			error: authApi.handleAccessDenied,
		});
	}

  function loadAncestors(ancestors, descendants) {
    return $.ajax({
      url: sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        ancestors: ancestors,
        descendants: descendants
      })
    });
  }

  function loadFacets(expression, url) {
		return $.ajax({
			url: sharedState.vocabularyUrl() +  (url || 'included-concepts/facets'),
      method: 'POST',
			contentType: 'application/json',
      data: expression,
		});
	}

  var api = {
		getConceptSet: getConceptSet,
		getGenerationInfo: getGenerationInfo,
		deleteConceptSet: deleteConceptSet,
		exists: exists,
		saveConceptSet,
		saveConceptSetItems,
		includedConceptSetCount,
    getConceptSetExpression,
    resolveConceptSetExpression,
		loadAncestors,
		loadFacets,
	};

	return api;
});