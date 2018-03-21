define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var lscache = require('lscache');

	var sources;

	function getSources() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'source/sources/',
			error: function (error) {
				sharedState.appInitializationStatus('failed');
			},
			success: function (o) {
				// this is the initial communication to WebAPI and if it succeeds
				// the initialization is complete and the application is ready.
				sharedState.appInitializationStatus('complete');
			}
		});
		return promise;
	}

	function getCacheKey() {
		return 'ATLAS|' + config.api.url;
	}

	function initSourcesConfig() {
		config.api.available = true;

		var servicePromise = $.Deferred();

		var serviceCacheKey = getCacheKey();

		var evidencePriority = 0;
		var vocabularyPriority = 0;
		var densityPriority = 0;

		$.ajax({
			url: config.api.url + 'source/sources',
			method: 'GET',
			contentType: 'application/json',
			success: function (sources) {
				config.api.sources = [];
				config.api.available = true;
				var completedSources = 0;

				$.each(sources, function (sourceIndex, source) {
					source.hasVocabulary = false;
					source.hasEvidence = false;
					source.hasResults = false;
					source.hasCDM = false;
					source.vocabularyUrl = '';
					source.evidenceUrl = '';
					source.resultsUrl = '';
					source.error = '';

					source.initialized = true;
					for (var d = 0; d < source.daimons.length; d++) {
						var daimon = source.daimons[d];

						// evaluate vocabulary daimons
						if (daimon.daimonType == 'Vocabulary') {
							source.hasVocabulary = true;
							source.vocabularyUrl = config.api.url + 'vocabulary/' + source.sourceKey + '/';
							if (daimon.priority >= vocabularyPriority) {
								vocabularyPriority = daimon.priority;
								sharedState.vocabularyUrl(source.vocabularyUrl);
							}
						}

						// evaluate evidence daimons
						if (daimon.daimonType == 'Evidence') {
							source.hasEvidence = true;
							source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
							if (daimon.priority >= evidencePriority) {
								evidencePriority = daimon.priority;
								sharedState.evidenceUrl(source.evidenceUrl);
							}
						}

						// evaluate results daimons
						if (daimon.daimonType == 'Results') {
							source.hasResults = true;
							source.resultsUrl = config.api.url + 'cdmresults/' + source.sourceKey + '/';
							if (daimon.priority >= densityPriority) {
								densityPriority = daimon.priority;
								sharedState.resultsUrl(source.resultsUrl);
							}
						}

						// evaluate cdm daimons
						if (daimon.daimonType == 'CDM') {
							source.hasCDM = true;
						}
					}

					config.api.sources.push(source);

					if (source.hasVocabulary) {
						$.ajax({
							url: config.api.url + 'vocabulary/' + source.sourceKey + '/info',
							timeout: 20000,
							method: 'GET',
							contentType: 'application/json',
							success: function (info) {
								completedSources++;
								source.version = info.version;
								source.dialect = info.dialect;

								if (completedSources == sources.length) {
									lscache.set(serviceCacheKey, config.api, 720);
									servicePromise.resolve();
								}
							},
							error: function (err) {
								completedSources++;
								pageModel.initializationErrors++;
								source.version = 'unknown';
								source.dialect = 'unknown';
								source.url = config.api.url + source.sourceKey + '/';
								if (completedSources == sources.length) {
									lscache.set(serviceCacheKey, config.api, 720);
									servicePromise.resolve();
								}
							}
						});
					} else {
						completedSources++;
						source.version = 'not available'
						if (completedSources == sources.length) {
							servicePromise.resolve();
						}
					}
				});
			},
			error: function (xhr, ajaxOptions, thrownError) {
				config.api.available = false;
				config.api.xhr = xhr;
				config.api.thrownError = thrownError;

				sharedState.appInitializationStatus('failed');
				document.location = '#/configure';

				servicePromise.resolve();
			}
		});

		return servicePromise;
	}

	var api = {
		getCacheKey,
		getSources: getSources,
		initSourcesConfig,
	};

	return api;
});
