define(function (require, exports) {

	const Service = require('providers/Service');
	var sourceService = require('services/SourceService');
	
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var numeral = require('numeral');

	class VocabularyService extends Service {
		constructor(props) {
			super(props)
			this.domains = [];
			this.defaultSource = '';
			this.init();
		}

		async init() {
			try {
				const sources = await sourceService.find();
				if (sources.length == 0) {
					sharedState.appInitializationStatus('no-sources-available');
					return;
				}
				// find the source which has a Vocabulary Daimon with priority = 1
				var prioritySources = sources.filter(function (source) {
					return source.daimons.filter(function (daimon) {
						return daimon.daimonType == "Vocabulary" && daimon.priority == "1"
					}).length > 0
				});
				if (prioritySources.length > 0)
					this.defaultSource = prioritySources[0];
				else // find the first vocabulary or CDM daimon
					this.defaultSource = sources.filter(function (source) {
						return source.daimons.filter(function (daimon) {
							return daimon.daimonType == "Vocabulary" || daimon.daimonType == "CDM"
						}).length > 0
					})[0];
		
				// preload domain list once for all future calls to getDomains()
				const { data: results } = await this.httpService.doGet(`${config.api.url}vocabulary/${this.defaultSource.sourceKey}/domains`);
				this.domains = results.map(v => v.DOMAIN_ID);
			} catch(er) {
				sharedState.appInitializationStatus('failed');
			}
		}

		async loadDensity(results) {
			if (results.length == 0) {
				return 0;
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
			try {
				const { data: entries } = await this.httpService.doPost(`${sharedState.resultsUrl()}conceptRecordCount`, searchResultIdentifiers);
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
			} catch(er) {
				for (var c = 0; c < results.length; c++) {
					var concept = results[c];
					concept.RECORD_COUNT = 'timeout';
					concept.DESCENDANT_RECORD_COUNT = 'timeout';
				}				
			}
		}

		async search(searchString, options) {	
			var search = {
				QUERY: searchString,
				DOMAIN_ID: options.domains,
				INVALID_REASON: 'V'
			}
	
			const { data } = await this.httpService.doPost(`${config.api.url}vocabulary/${this.defaultSource.sourceKey}/search`, search);
			return data;	
		}

		async getConcept(id) {
			const { data } = await this.httpService.doGet(`${config.api.url}vocabulary/${this.defaultSource.sourceKey}/concept/${id}`);
			return data;
		}

		async getConceptSetList(url) {
			let repositoryUrl;
	
			if (url)
				repositoryUrl = url + 'conceptset/';
			else
				repositoryUrl = config.api.url + 'conceptset/';
	
			const { data } = await this.httpService.doGet(repositoryUrl);
			return data;
		}

		async getConceptSetExpression(id, url) {
			let repositoryUrl;
	
			if (url)
				repositoryUrl = url + 'conceptset/';
			else
				repositoryUrl = config.api.url + 'conceptset/';
	
			repositoryUrl += id + '/expression';
	
			const { data } = await this.httpService.doGet(repositoryUrl);
			return data;
		}

		async resolveConceptSetExpression(expression, url, sourceKey) {
			var repositoryUrl = (url || config.api.url) + 'vocabulary/' + (sourceKey || this.defaultSource.sourceKey) + '/resolveConceptSetExpression';
	
			const { data } = await this.httpService.doPost(repositoryUrl, expression);
			return data;	
		}
		
		async getConceptSetExpressionSQL(expression, url) {
			const repositoryUrl = (url || config.api.url) + 'vocabulary/conceptSetExpressionSQL';
	
			const { data } = await this.httpService.plainTextService.doPost(repositoryUrl, expression);
			return data;
		}

		async getConceptsById(identifiers, url, sourceKey) {
			var repositoryUrl;
			if (url || sourceKey) {
				repositoryUrl = (url || config.api.url) + 'vocabulary/' + (sourceKey || this.defaultSource.sourceKey) + '/lookup/identifiers';
			} else {
				repositoryUrl = sharedState.vocabularyUrl() + 'lookup/identifiers';
			}
	
			const { data } = await this.httpService.doPost(repositoryUrl, identifiers);
			return data;
		}

		async getConceptsByCode(codes) {
			var url = sharedState.vocabularyUrl() + 'lookup/sourcecodes';
			const { data } = await this.httpService.doPost(url, codes);
			return data;
		}

		async getMappedConceptsById(identifiers, url, sourceKey) {
			var repositoryUrl = (url || config.api.url) + 'vocabulary/' + (sourceKey || this.defaultSource.sourceKey) + '/lookup/mapped';
	
			const { data } = await this.httpService.doPost(repositoryUrl, identifiers);
			return data;	
		}

		async optimizeConceptSet(conceptSetItems, url, sourceKey) {
			var repositoryUrl = (url || config.api.url) + 'vocabulary/' + (sourceKey || this.defaultSource.sourceKey) + '/optimize';
	
			const { data } = await this.httpService.doPost(repositoryUrl, conceptSetItems);
			return data;
		}

		async compareConceptSet(compareTargets, url, sourceKey) {
			var repositoryUrl = (url || config.api.url) + 'vocabulary/' + (sourceKey || this.defaultSource.sourceKey) + '/compare';
	
			const { data } = await this.httpService.doPost(repositoryUrl, compareTargets);
			return data;
		}		
	}

	return new VocabularyService();
});
