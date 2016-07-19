define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sourceAPI = require('webapi/SourceAPI');
	
	var loadedPromise = $.Deferred();
	loadedPromise.resolve();

	var defaultSource;
	var domainPromise = $.Deferred();
	var domains = [];	
	
	sourceAPI.getSources().then(function(sources) {
		// find the source which has a Vocabulary Daimon with priority = 1
		var prioritySources = sources.filter(function(source) { return source.daimons.filter(function (daimon) { return daimon.daimonType == "Vocabulary" && daimon.priority == "1"}).length > 0 }); 
		if (prioritySources.length > 0)
			defaultSource = prioritySources[0];
		else // find the first vocabulary or CDM daimon
			defaultSource = sources.filter(function(source) { return source.daimons.filter(function (daimon) { return daimon.daimonType == "Vocabulary" || daimon.daimonType == "CDM"}).length > 0 })[0];
		
		// preload domain list once for all future calls to getDomains()
		$.ajax({
			url: config.webAPIRoot + defaultSource.sourceKey + '/' + 'vocabulary/domains',
		}).then(function (results){
			$.each(results, function(i,v) {
				domains.push(v.DOMAIN_ID);
			});
			domainPromise.resolve(domains);			
		});		
	})
	
	function search(searchString, options) {
		var deferred = $.Deferred();
		
		var search = {
			QUERY : searchString,
			DOMAIN_ID : options.domains,
			INVALID_REASON: 'V'
		}
		
		$.ajax({
			url: config.webAPIRoot + defaultSource.sourceKey + '/' + 'vocabulary/search',
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(search),
			success: function(results) {
				deferred.resolve(results)
			}
		});
				
		return deferred.promise();
	}

	function getDomains() {
		// this is initliazed once for all calls
		return domainPromise;
	}
	
	function getConcept(id) {
		var getConceptPromise = $.ajax({
			url: config.webAPIRoot + defaultSource.sourceKey + '/vocabulary/concept/' + id
		});
		
		return getConceptPromise;
	}
	
	function getConceptSetList(url)
	{
		var repositoryUrl;
		
		if (url)
			repositoryUrl = url + 'conceptset/';
		else
			repositoryUrl = config.webAPIRoot + defaultSource.sourceKey + '/conceptset/';
		
		var getConceptSetListPromise = $.ajax({
			url: repositoryUrl
		});

		return getConceptSetListPromise;
	}
	
	function getConceptSetExpression(id, url)
	{
		var repositoryUrl;
		
		if (url)
			repositoryUrl = url + 'conceptset/';
		else
			repositoryUrl = config.webAPIRoot + defaultSource.sourceKey + '/conceptset/';

		repositoryUrl += id + '/expression';
		
		var getConceptSetPromise = $.ajax({
			url: repositoryUrl
		});
		
		return getConceptSetPromise;
	}
	
	function resolveConceptSetExpression(expression, url)
	{
		var repositoryUrl;
		
		if (url)
			repositoryUrl = url + 'vocabulary/resolveConceptSetExpression';
		else
			repositoryUrl = config.webAPIRoot + defaultSource.sourceKey + '/vocabulary/resolveConceptSetExpression';

		var resolveConceptSetExpressionPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(expression),
			method: 'POST',
			contentType: 'application/json'
		});
		
		return resolveConceptSetExpressionPromise;
	}
	
	function getConceptsById(identifiers, url)
	{
		var repositoryUrl;
		
		if (url)
			repositoryUrl = url + 'vocabulary/lookup/identifiers';
		else
			repositoryUrl = config.webAPIRoot + defaultSource.sourceKey + '/vocabulary/lookup/identifiers';

		var getConceptsByIdPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(identifiers),
			method: 'POST',
			contentType: 'application/json'
		});
		
		return getConceptsByIdPromise;
	}

	function getMappedConceptsById(identifiers, url)
	{
		var repositoryUrl;
		
		if (url)
			repositoryUrl = url + 'vocabulary/lookup/mapped';
		else
			repositoryUrl = config.webAPIRoot + defaultSource.sourceKey + '/vocabulary/lookup/mapped';

		var getMappedConceptsByIdPromise = $.ajax({
			url: repositoryUrl,
			data: JSON.stringify(identifiers),
			method: 'POST',
			contentType: 'application/json'
		});
		
		return getMappedConceptsByIdPromise;
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
		getMappedConceptsById: getMappedConceptsById
	}

	return api;
});