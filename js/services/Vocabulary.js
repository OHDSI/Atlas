define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sourceAPI = require('services/SourceAPI');
	var sharedState = require('atlas-state');
	var numeral = require('numeral');
	var authAPI = require('services/AuthAPI');
	const httpService = require('services/http');
	const CDMResultAPI = require('services/CDMResultsAPI');

	var loadedPromise = $.Deferred();
	loadedPromise.resolve();

	var defaultSource;
	var domainsPromise = null;
	var domains = [];

	function getDomains() {
		// if domains haven't yet been requested, create the promise
		if (!domainsPromise) {
			let loadPromise = new Promise((resolve, reject) => {
				sourceAPI.getSources().then(function (sources) {
					if (sources.length === 0) {
						resolve(domains);
						return;
					}
					// find the source which has a Vocabulary Daimon with priority = 1
					var prioritySources = sources.filter(function (source) {
						return source.daimons.filter(function (daimon) {
							return daimon.daimonType == "Vocabulary" && daimon.priority == "1"
						}).length > 0
					});
					if (prioritySources.length > 0)
						defaultSource = prioritySources[0];
					else // find the first vocabulary or CDM daimon
						defaultSource = sources.filter(function (source) {
							return source.daimons.filter(function (daimon) {
								return daimon.daimonType == "Vocabulary" || daimon.daimonType == "CDM"
							}).length > 0
						})[0];

					// preload domain list once for all future calls to getDomains()
					if (defaultSource !== undefined) {
						$.ajax({
							url: config.webAPIRoot + 'vocabulary/' + defaultSource.sourceKey + '/domains',
						}).then(function (results) {
							$.each(results, function (i, v) {
								domains.push(v.DOMAIN_ID);
							});
							resolve(domains);
							domainsPromise = loadPromise; // store promise for future invocations
						});
					} else {
						resolve(domains);	
					}
				});
			});
			return loadPromise;
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
		return CDMResultAPI.getConceptRecordCountWithResultsUrl(sharedState.resultsUrl(), searchResultIdentifiers, results, false);
	}

	function search(searchString, options) {
		var deferred = $.Deferred();

		var search = {
			QUERY: searchString,
			DOMAIN_ID: options.domains,
			INVALID_REASON: 'V'
		}

		$.ajax({
			url: config.webAPIRoot + 'vocabulary/' + defaultSource.sourceKey + '/search',
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
		var getConceptPromise = $.ajax({
			url: config.webAPIRoot + 'vocabulary/' + defaultSource.sourceKey + '/concept/' + id,
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

		var repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/' + (sourceKey || defaultSource.sourceKey) + '/resolveConceptSetExpression';

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
		const repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/conceptSetExpressionSQL';

		return httpService.plainTextService.doPost(repositoryUrl, expression);
	}

	function getConceptsById(identifiers, url, sourceKey) {
		var repositoryUrl;
		if (url || sourceKey) {
      repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/' + (sourceKey || defaultSource.sourceKey) + '/lookup/identifiers';
    } else {
			repositoryUrl = sharedState.vocabularyUrl() + 'lookup/identifiers';
		}

		var getConceptsByIdPromise = httpService.doPost(repositoryUrl, identifiers);

		return getConceptsByIdPromise;
	}

	function getConceptsByCode(codes) {
		var url = sharedState.vocabularyUrl() + 'lookup/sourcecodes';
		const promise = httpService.doPost(url, codes);

		return promise;
	}

	function getMappedConceptsById(identifiers, url, sourceKey) {
		var repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/' + (sourceKey || defaultSource.sourceKey) + '/lookup/mapped';

		var getMappedConceptsByIdPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(identifiers),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
	});

		return getMappedConceptsByIdPromise;
	}

	function optimizeConceptSet(conceptSetItems, url, sourceKey) {
		var vocabUrl = sourceKey === undefined ? sharedState.vocabularyUrl() : (url || config.webAPIRoot) + 'vocabulary/' + sourceKey;

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
		var repositoryUrl = (url || config.webAPIRoot) + 'vocabulary/' + (sourceKey || defaultSource.sourceKey) + '/compare';

		var getComparedConceptSetPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(compareTargets),
			method: 'POST',
			contentType: 'application/json',
			error: authAPI.handleAccessDenied,
	});

		return getComparedConceptSetPromise;
	}

	var api = {
		loaded: loadedPromise,
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
