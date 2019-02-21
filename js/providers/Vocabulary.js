define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sourceAPI = require('webapi/SourceAPI');
	var sharedState = require('atlas-state');
	var numeral = require('numeral');
	var authAPI = require('webapi/AuthAPI');
	const httpService = require('services/http');
	const lodash = require('lodash');

	var loadedPromise = $.Deferred();
	loadedPromise.resolve();

	var defaultSource;
	var domainsPromise = null;
	var domains = [];

	authAPI.isAuthenticated.subscribe(authed => authed && loadDefaultSource());

	function loadDefaultSource() {
		if (typeof defaultSource !== "undefined") {
			return new Promise(res => res());
		}

		return sourceAPI.getSources().then(function (sources) {
			if (sources.length !== 0) {
			// find the source which has a Vocabulary Daimon with priority = 1
			var prioritySources = sources.filter(function (source) {
				return source.daimons.filter(function (daimon) {
					return daimon.daimonType == "Vocabulary" && daimon.priority > 0 && authAPI.hasSourceAccess(source.sourceKey)
				}).length > 0
			});

			lodash.sortBy(prioritySources, s => -1 * s.daimons.find(d => d.daimonType === "Vocabulary").priority);

			if (prioritySources.length > 0)
				defaultSource = prioritySources[0];
			else // find the first vocabulary or CDM daimon
				defaultSource = sources.find(function (source) {
					return source.daimons.filter(function (daimon) {
						return daimon.daimonType == "Vocabulary" || daimon.daimonType == "CDM"
					}).length > 0
				});
			}
		});
	}

	function getVocabUrl(url, sourceKey) {
		return sourceKey === undefined ? sharedState.vocabularyUrl() : (url || config.webAPIRoot) + 'vocabulary/' + sourceKey;
	}

	function getDomains() {
		// if domains haven't yet been requested, create the promise
		if (!domainsPromise) {
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
		}
		return domainsPromise;
	}

	function loadDensity(results) {
		var densityPromise = $.Deferred();

		if (results.length == 0) {
			densityPromise.resolve();
			return densityPromise;
		}
		var searchResultIdentifiers = [];
		var resultsIndex = [];
		for (c = 0; c < results.length; c++) {
			// optimization - only lookup standard concepts as non standard concepts will not have records
			results[c].RECORD_COUNT = 0;
			results[c].DESCENDANT_RECORD_COUNT = 0;
			if (results[c].STANDARD_CONCEPT_CAPTION == 'Standard' || results[c].STANDARD_CONCEPT_CAPTION == 'Classification') {
				searchResultIdentifiers.push(results[c].CONCEPT_ID);
				resultsIndex.push(c);
			}
		}
		var densityIndex = {};
		$.ajax({
			url: sharedState.resultsUrl() + 'conceptRecordCount',
			method: 'POST',
			contentType: 'application/json',
			timeout: 10000,
			data: JSON.stringify(searchResultIdentifiers),
			success: function (entries) {
				var formatComma = "0,0";
				for (var e = 0; e < entries.length; e++) {
					densityIndex[Object.keys(entries[e])[0]] = Object.values(entries[e])[0];
				}
				for (var c = 0; c < resultsIndex.length; c++) {
					var concept = results[resultsIndex[c]];
					if (densityIndex[concept.CONCEPT_ID] != undefined) {
						concept.RECORD_COUNT = numeral(densityIndex[concept.CONCEPT_ID][0]).format(formatComma);
						concept.DESCENDANT_RECORD_COUNT = numeral(densityIndex[concept.CONCEPT_ID][1]).format(formatComma);
					}
				}
				densityPromise.resolve();
			},
			error: function (error) {
				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					concept.RECORD_COUNT = 'timeout';
					concept.DESCENDANT_RECORD_COUNT = 'timeout';
				}
				densityPromise.resolve();
			}
		});
		return densityPromise;
	}

	function search(searchString, options) {
		const vocabUrl = getVocabUrl();
		
		var deferred = $.Deferred();

		var search = {
			QUERY: searchString,
			DOMAIN_ID: options.domains,
			INVALID_REASON: 'V'
		}

		$.ajax({
			url: vocabUrl + 'search',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(search),
			success: function (results) {
				deferred.resolve(results)
			}
		});

		return deferred.promise();
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
		var repositoryUrl;

		if (url)
			repositoryUrl = url + 'conceptset/';
		else
			repositoryUrl = config.webAPIRoot + 'conceptset/';

		repositoryUrl += id + '/expression';

		var getConceptSetPromise = $.ajax({
			url: repositoryUrl,
			error: authAPI.handleAccessDenied,
		});

		return getConceptSetPromise;
	}

	function resolveConceptSetExpression(expression, url, sourceKey) {
		const vocabUrl = getVocabUrl();

		const repositoryUrl = vocabUrl + 'resolveConceptSetExpression';

		var resolveConceptSetExpressionPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(expression),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
	});

		return resolveConceptSetExpressionPromise;
	}

	function getConceptSetExpressionSQL(expression, url) {
		var repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/conceptSetExpressionSQL';

		var conceptSetExpressionSQLPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(expression),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
	});

		return conceptSetExpressionSQLPromise;
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

	function optimizeConceptSet(conceptSetItems, url, sourceKey) {
		const vocabUrl = getVocabUrl(url, sourceKey);
		
		var getOptimizedConceptSetPromise = $.ajax({
			url: vocabUrl + 'optimize',
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

	var api = {
		getDeafultSource: () => defaultSource,
		search: search,
		getDomains: getDomains,
		getConcept: getConcept,
		getConceptSetList: getConceptSetList,
		getConceptSetExpression: getConceptSetExpression,
		resolveConceptSetExpression: resolveConceptSetExpression,
		getConceptsById: getConceptsById,
		getConceptsByCode: getConceptsByCode,
		getMappedConceptsById: getMappedConceptsById,
		getConceptSetExpressionSQL: getConceptSetExpressionSQL,
		optimizeConceptSet: optimizeConceptSet,
		compareConceptSet: compareConceptSet,
		loadDensity: loadDensity
	}

	return api;
});
