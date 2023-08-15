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
	
	async function loadConceptSet(id) {
		return authApi.executeWithRefresh(httpService.doGet(config.api.url + 'conceptset/' + id).then(({ data }) => data));
	}

	function loadConceptSetExpression(conceptSetId) {
		const sourceKey = sharedState.sourceKeyOfVocabUrl();
		return httpService.doGet(config.api.url + 'conceptset/' + conceptSetId + '/expression' + (sourceKey ? `/${sourceKey}`: ''))
			.then(({ data }) => data)
			.catch((err) => {
				console.log((err.data && err.data.payload) ? err.data.payload : err);
				let message = err.data && err.data.payload && err.data.payload.message
					? err.data.payload.message
					: ko.i18n('components.conceptSet.expressionResolveError', 'Error occurred during resolving expression!')();
				if (err.status === 403) {
					message += ' - ' + ko.i18n('components.conceptSet.forbiddenError', 'You are not authorized to view the concept set expression.')();
				}
				alert(message);
				self.isLoading(false);
			});
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

  async function saveConceptSet(conceptSet) {
		let promise;
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

	function runDiagnostics(conceptSet) {
		return httpService
			.doPost(`${config.webAPIRoot}conceptset/check`, conceptSet)
			.then(res => res.data);
	}

	function getVersions(conceptSetId) {
		return httpService
			.doGet(`${config.webAPIRoot}conceptset/${conceptSetId}/version/`)
			.then(res => res.data);
	}

	function getVersion(conceptSetId, versionNumber) {
		return httpService.doGet(`${config.webAPIRoot}conceptset/${conceptSetId}/version/${versionNumber}`)
			.then(res => res.data)
			.catch(error => {
				console.log("Error: " + error);
				authApi.handleAccessDenied(error);
			});
	}

	function getVersionExpression(conceptSetId, versionNumber) {
		const sourceKey = sharedState.sourceKeyOfVocabUrl();
		return httpService.doGet(`${config.webAPIRoot}conceptset/${conceptSetId}/version/${versionNumber}/expression` + (sourceKey ? `/${sourceKey}`: '')).then(({ data }) => data);
	}

	async function copyVersion(conceptSetId, versionId) {
		return authApi.executeWithRefresh(httpService
			.doPut(`${config.webAPIRoot}conceptset/${conceptSetId}/version/${versionId}/createAsset`)
			.then(({ data }) => data));
	}

	function updateVersion(version) {
		return httpService.doPut(`${config.webAPIRoot}conceptset/${version.assetId}/version/${version.version}`, {
			comment: version.comment,
			archived: version.archived
		}).then(({ data }) => data);
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
		runDiagnostics,
		getVersions,
		getVersion,
		getVersionExpression,
		updateVersion,
		copyVersion
	};

	return api;
});