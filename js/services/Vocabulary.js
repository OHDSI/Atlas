define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sourceAPI = require('services/SourceAPI');
	var sharedState = require('atlas-state');
	var numeral = require('numeral');
	var authAPI = require('services/AuthAPI');
	const httpService = require('services/http');
	const CDMResultAPI = require('services/CDMResultsAPI');
	const lodash = require('lodash');

	var domainsPromise = null;
	var domains = [];

	function getVocabUrl(url, sourceKey) {
		return sourceKey === undefined ? sharedState.vocabularyUrl() : (url || config.webAPIRoot) + 'vocabulary/' + sourceKey;
	}

	function encodeQuery(str) {
		str = encodeURIComponent(str);
		str = str.replace(/\*/g, '%2A'); // handle asterisk for wildcard search
		return str;
	}

	function getDomains() {
		// if domains haven't yet been requested, create the promise
		if (!domainsPromise) {
			if (sharedState.vocabularyUrl()) {
				domainsPromise = new Promise((resolve, reject) => {
					$.ajax({
						url: sharedState.vocabularyUrl() + 'domains',
					}).then(function (results) {
						$.each(results, function (i, v) {
							domains.push(v.DOMAIN_ID);
						});
						resolve(domains);
					});
				});
			} else {
				return new Promise((resolve, reject) => resolve([]));
			}
		}
		return domainsPromise;
	}

	function loadDensity(results, sourceKey, formatter) {
		var densityPromise = $.Deferred();

		if (results.length == 0) {
			densityPromise.resolve();
			return densityPromise;
		}

		var searchResultIdentifiers = [];
		for (c = 0; c < results.length; c++) {
			results[c].RECORD_COUNT = 0;
			results[c].DESCENDANT_RECORD_COUNT = 0;
			results[c].PERSON_COUNT = 0;
			results[c].DESCENDANT_PERSON_COUNT = 0;
			searchResultIdentifiers.push(results[c].CONCEPT_ID);
		}
		return sourceKey ?
			CDMResultAPI.getConceptRecordCount(sourceKey, searchResultIdentifiers, results, false, formatter) :
			CDMResultAPI.getConceptRecordCountWithResultsUrl(sharedState.resultsUrl(), searchResultIdentifiers, results, false, formatter);
	}

	async function search(params) {
		const vocabUrl = getVocabUrl();

		if (params.QUERY && Object.keys(params).length == 1)  // simple search via GET
		{
			return  httpService.doGet(`${vocabUrl}search?query=${encodeQuery(params.QUERY)}`).then(({ data }) => data)
		}

		return httpService.doPost(`${vocabUrl}search`,params).then(({ data }) => data);
	}

	function getConcept(id) {
		const vocabUrl = getVocabUrl();

		var getConceptPromise = $.ajax({
			url: vocabUrl + 'concept/' + id,
			error: authAPI.handleAccessDenied,
		});

		return getConceptPromise;
	}

	function getConceptSetList(url) {
		var repositoryUrl;

		if (url)
			repositoryUrl = url + 'conceptset/';
		else
			repositoryUrl = config.webAPIRoot + 'conceptset/';

		var getConceptSetListPromise = $.ajax({
			url: repositoryUrl,
			error: authAPI.handleAccessDenied,
		});

		return getConceptSetListPromise;
	}

	function getConceptSetExpression(id, url) {
		let repositoryUrl;

		if (url)
			repositoryUrl = url + 'conceptset/';
		else
			repositoryUrl = config.webAPIRoot + 'conceptset/';

		repositoryUrl += id + '/expression';

		return httpService.doGet(repositoryUrl).then(({ data }) => data);
	}

	function resolveConceptSetExpression(expression, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);
		return httpService.doPost(vocabUrl + 'resolveConceptSetExpression', expression).then(({ data }) => data);
	}

	function getConceptSetExpressionSQL(expression, url) {
		const repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/conceptSetExpressionSQL';

		return httpService.plainTextService.doPost(repositoryUrl, expression);
	}

	function getConceptsById(identifiers, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);
		const repositoryUrl = vocabUrl + 'lookup/identifiers';

		var getConceptsByIdPromise = httpService.doPost(repositoryUrl, identifiers);

		return getConceptsByIdPromise;
	}

	function getConceptsByCode(codes) {
		var url = sharedState.vocabularyUrl() + 'lookup/sourcecodes';
		const promise = httpService.doPost(url, codes);

		return promise;
	}

	function getMappedConceptsById(identifiers, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);

		var getMappedConceptsByIdPromise = $.ajax({
			url: vocabUrl + 'lookup/mapped',
			data: JSON.stringify(identifiers),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
		});

		return getMappedConceptsByIdPromise;
	}

	async function  getRecommendedConceptsById(identifiers, url, sourceKey) {
		var vocabUrl = getVocabUrl(url, sourceKey) + 'lookup/recommended';
		return httpService.doPost(vocabUrl, identifiers).then(({ data }) => data);;
	}

	function optimizeConceptSet(conceptSetItems, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);

		var getOptimizedConceptSetPromise = $.ajax({
			url:  vocabUrl + 'optimize',
			data: JSON.stringify(conceptSetItems),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
	});

		return getOptimizedConceptSetPromise;
	}

	function compareConceptSet(compareTargets, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);

		var getComparedConceptSetPromise = $.ajax({
			url: vocabUrl + 'compare',
			data: JSON.stringify(compareTargets),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
		});

		return getComparedConceptSetPromise;
	}

	function compareConceptSetCsv(compareTargets,types, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);

		var getComparedConceptSetPromise = $.ajax({
			url: vocabUrl + 'compare-arbitrary',
			data:  JSON.stringify({compareTargets: compareTargets, types:types}),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
		});

		return getComparedConceptSetPromise;
	}
	
	async function loadAncestors(ancestors, descendants, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);
		const data = { ancestors, descendants };
		return httpService.doPost(vocabUrl + 'lookup/identifiers/ancestors', data);
	}	

	var api = {
		search: search,
		getDomains: getDomains,
		getConcept: getConcept,
		getConceptSetList: getConceptSetList,
		getConceptSetExpression: getConceptSetExpression,
		resolveConceptSetExpression: resolveConceptSetExpression,
		getConceptsById: getConceptsById,
		getConceptsByCode: getConceptsByCode,
		getMappedConceptsById: getMappedConceptsById,
		getRecommendedConceptsById: getRecommendedConceptsById,
		getConceptSetExpressionSQL: getConceptSetExpressionSQL,
		optimizeConceptSet: optimizeConceptSet,
		compareConceptSet: compareConceptSet,
		compareConceptSetCsv: compareConceptSetCsv,
		loadDensity: loadDensity,
		loadAncestors,
	}

	return api;
});
