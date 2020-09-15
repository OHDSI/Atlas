define(function (require) {
	const ko = require('knockout');
	const httpService = require('services/http');
	const sharedState = require('atlas-state');
	const config = require('appConfig');
	const authApi = require('services/AuthAPI');
	const vocabularyService = require('services/Vocabulary');
	const commonUtils = require('utils/CommonUtils');
	const globalConstants = require('const');
	const _ = require('lodash');
	const hash = require('hash-it').default;
	
	function loadConceptSet(id) {
		return httpService.doGet(config.api.url + 'conceptset/' + id).then(({ data }) => data);
	}

	function loadConceptSetExpression(conceptSetId) {
		const sourceKey = sharedState.sourceKeyOfVocabUrl();
		return httpService.doGet(config.api.url + 'conceptset/' + conceptSetId + '/expression' + (sourceKey ? `/${sourceKey}`: '')).then(({ data }) => data);
	}

	function lookupIdentifiers(identifiers) {
		return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', identifiers);
	}

	function getInclusionCount(expression) {
		const data = ko.toJS(expression);
		return httpService.doPost(sharedState.vocabularyUrl() + 'included-concepts/count', data);
	}

	function getGenerationInfo(conceptSetId) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + + (conceptSetId || '-1') + '/generationinfo')
			.then(({ data }) => data)
			.catch(authApi.handleAccessDenied);
	}

	function deleteConceptSet(conceptSetId) {
	return httpService.doDelete(config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1'))
		.catch(authApi.handleAccessDenied);
	}

  function exists(name, id) {
		return httpService.doGet(`${config.webAPIRoot}conceptset/${id}/exists?name=${name}`)
			.then(({ data }) => data);
  }

  function saveConceptSet(conceptSet) {
		let promise = new Promise(r => r());
		const url = `${config.api.url}conceptset/${conceptSet.id ? conceptSet.id : ''}`;
		if (conceptSet.id) {
			promise = httpService.doPut(url, conceptSet);
		} else {
			promise = httpService.doPost(url, conceptSet);
		}
		promise.catch(authApi.handleAccessDenied);

		return promise;
	}

	function saveConceptSetItems(id, conceptSetItems) {
		return httpService.doPut(config.api.url + 'conceptset/' + id + '/items', conceptSetItems)
			.catch(authApi.handleAccessDenied);
	}

	function getConceptSet(conceptSetId) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + (conceptSetId || '-1'))
			.catch(authApi.handleAccessDenied);
	}

	function getCopyName(id) {
		return httpService.doGet(config.webAPIRoot + 'conceptset/' + (id || "") + "/copy-name")
			.then(({ data }) => data);
	}
	
	const api = {
		loadConceptSet,
		loadConceptSetExpression,
		lookupIdentifiers,
		getInclusionCount,
		getCopyName,
		getConceptSet,
		getGenerationInfo,
		deleteConceptSet,
		exists,
		saveConceptSet,
		saveConceptSetItems,
	};

	return api;
});