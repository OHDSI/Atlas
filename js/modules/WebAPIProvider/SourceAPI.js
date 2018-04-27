define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var ohdsiUtil = require('ohdsi.util');
	var authApi = require('services/auth');
  var lscache = require('lscache');
  var ko = require('knockout');

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

  function saveSource(sourceKey, source) {
		var json = JSON.stringify(source);
		lscache.remove(getCacheKey());
		var promise = ohdsiUtil.cachedAjax({
			method: sourceKey ? 'PUT' : 'POST',
			url: config.api.url + 'source/' + (sourceKey || ''),
			contentType: 'application/json',
			data: json,
			dataType: 'json',
			error: authApi.handleAccessDenied,
		});
		return promise;
  }

  function getSource(sourceKey) {
	  return ohdsiUtil.cachedAjax({
      method: 'GET',
      url: config.api.url + 'source/details/' + sourceKey,
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
    });
  }

  function deleteSource(sourceKey) {
	  lscache.remove(getCacheKey());
	  return $.ajax({
      url: config.webAPIRoot + 'source/' + sourceKey,
      method: 'DELETE',
      error: authApi.handleAccessDenied,
    });
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
        sharedState.sources([]);
        config.api.available = true;
        var completedSources = 0;
        var result = [];

        $.each(sources, function (sourceIndex, source) {
          source.hasVocabulary = false;
          source.hasEvidence = false;
          source.hasResults = false;
          source.hasCDM = false;
          source.vocabularyUrl = '';
          source.evidenceUrl = '';
          source.resultsUrl = '';
          source.error = '';
          source.version = ko.observable('unknown');
          source.dialect = ko.observable();

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

          result.push(source);
          //sharedState.sources.push(source);

          if (source.hasVocabulary) {
            $.ajax({
              url: config.api.url + 'vocabulary/' + source.sourceKey + '/info',
              timeout: 20000,
              method: 'GET',
              contentType: 'application/json',
              success: function (info) {
                completedSources++;
                source.version(info.version);
                source.dialect(info.dialect);

                if (completedSources == sources.length) {
                  lscache.set(serviceCacheKey, config.api, 720);
                  servicePromise.resolve();
                }
              },
              error: function (err) {
                completedSources++;
                pageModel.initializationErrors++;
                source.version('unknown');
                source.dialect('unknown');
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
        sharedState.sources(result);
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
		getSources: getSources,
    getSource: getSource,
		saveSource: saveSource,
		getCacheKey: getCacheKey,
		initSourcesConfig: initSourcesConfig,
    deleteSource: deleteSource,
	};

	return api;
});
