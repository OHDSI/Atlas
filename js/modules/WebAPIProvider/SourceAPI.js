define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var ohdsiUtil = require('assets/ohdsi.util');
	var authApi = require('webapi/AuthAPI');
  var lscache = require('lscache');
  var ko = require('knockout');
	const httpService = require('services/httpService');

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
				sharedState.appInitializationStatus('running');
			}
		});
		return promise;
	}

  function getCacheKey() {
    return 'ATLAS|' + config.api.url;
  }

  function saveSource(sourceKey, source) {
      var formData = new FormData();
      formData.append("keytab", source.keytab);
      formData.append("source", new Blob([JSON.stringify(source)],{type: "application/json"}));

      lscache.remove(getCacheKey());
      if (sourceKey) {
        return httpService.doPut(config.api.url + 'source/' + (sourceKey), formData);
      } else {
        return httpService.doPost(config.api.url + 'source/' + (''), formData);
      }
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

  const connectionCheckState = {
    unknown: 'unknown',
    success: 'success',
    checking: 'checking',
    failed: 'failed',
  };
  
  function initSourcesConfig() {
    var servicePromise = $.Deferred();
    $.ajax({
      url: config.api.url + 'source/sources',
      method: 'GET',
      contentType: 'application/json',
      success: (sources) => {
        config.api.available = true;
        setSharedStateSources(sources);
        servicePromise.resolve();
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

  function setSharedStateSources(sources) {
    sharedState.sources([]);
    var serviceCacheKey = getCacheKey();
    var sourceList = [];
    var evidencePriority = 0;
    var vocabularyPriority = 0;
    var densityPriority = 0;

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
      source.connectionCheck = ko.observable(connectionCheckState.unknown);
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

        // evaluate cem daimons
        if (daimon.daimonType == 'CEM') {
          source.hasEvidence = true;
          source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
          if (daimon.priority >= evidencePriority) {
            evidencePriority = daimon.priority;
            sharedState.evidenceUrl(source.evidenceUrl);
          }
        }

        // evaluate cem daimons
        if (daimon.daimonType == 'CEMResults') {
          source.hasResults = true;
          source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
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

      sourceList.push(source);

      if (source.hasVocabulary) {
        $.ajax({
          url: config.api.url + 'vocabulary/' + source.sourceKey + '/info',
          timeout: 20000,
          method: 'GET',
          contentType: 'application/json',
          success: function (info) {
            source.version(info.version);
            source.dialect(info.dialect);
          },
          error: function (err) {
            source.version('unknown');
            source.dialect('unknown');
            source.url = config.api.url + source.sourceKey + '/';
          }
        });
      } else {
        source.version = 'not available'
      }
    });

    sharedState.sources(sourceList);
    if (config.cacheSources) {
      config.api.sources = sourceList;
      lscache.set(serviceCacheKey, config.api, 720);
    }
  }

  function checkSourceConnection(sourceKey) {
    return httpService.doGet(config.webAPIRoot + 'source/connection/' + sourceKey)
  }

  function updateSourceDaimonPriority(sourceKey, daimonType) {
    return httpService.doPost(config.api.url + 'source/' + sourceKey + '/daimons/' + daimonType + '/set-priority');
  }

  var api = {
    getSources: getSources,
    getSource: getSource,
    saveSource: saveSource,
    getCacheKey: getCacheKey,
    initSourcesConfig: initSourcesConfig,
    deleteSource: deleteSource,
    checkSourceConnection: checkSourceConnection,
    connectionCheckState: connectionCheckState,
    setSharedStateSources: setSharedStateSources,
    updateSourceDaimonPriority,
	};

	return api;
});
