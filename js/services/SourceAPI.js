define(function (require, exports) {

	var $ = require('jquery');
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var ohdsiUtil = require('assets/ohdsi.util');
	var authApi = require('services/AuthAPI');
	var lscache = require('lscache');
	var ko = require('knockout');
	const lodash = require('lodash');
	const httpService = require('services/http');
	const constants = require('const');

	var sources;

	function getSources() {
		return $.ajax({
			url: config.webAPIRoot + 'source/sources/'
		});
	}

  function getCacheKey() {
    return 'ATLAS|' + config.api.url;
  }

  function saveSource(sourceKey, source) {
      var formData = new FormData();
      formData.append("keyfile", source.keyfile);
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
    return httpService.doDelete(`${config.webAPIRoot}source/${sourceKey}`);
  }

  const buttonCheckState = {
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
        if (sources.length === 0) {
            servicePromise.resolve(constants.applicationStatuses.noSourcesAvailable);
        }
        setSharedStateSources(sources);
        servicePromise.resolve(constants.applicationStatuses.running);
      },
      error: function (xhr, ajaxOptions, thrownError) {
        if (xhr.status !== 403) {
          config.api.available = false;
          config.api.xhr = xhr;
          config.api.thrownError = thrownError;
          document.location = '#/configure';
        }

        servicePromise.resolve(constants.applicationStatuses.failed);
      }
    });

    return servicePromise;
  }

  function setSharedStateSources(sources) {
    sharedState.sources([]);
    var serviceCacheKey = getCacheKey();
    var sourceList = [];
    var evidencePriority = 1;
    var vocabularyPriority = 1;
    var densityPriority = 1;

    $.each(sources, function (sourceIndex, source) {
      source.hasVocabulary = false;
      source.hasEvidence = false;
      source.hasResults = false;
      source.hasCEMResults = false;
      source.hasCDM = false;
      source.vocabularyUrl = '';
      source.evidenceUrl = '';
      source.resultsUrl = '';
      source.error = '';
      source.version = ko.observable();
      source.dialect = ko.observable();
      source.connectionCheck = ko.observable(buttonCheckState.unknown);
      source.refreshState = ko.observable(buttonCheckState.unknown);
      source.initialized = true;
      for (var d = 0; d < source.daimons.length; d++) {
        var daimon = source.daimons[d];

        // evaluate vocabulary daimons
        if (daimon.daimonType == 'Vocabulary') {
          source.hasVocabulary = true;
          source.vocabularyUrl = config.api.url + 'vocabulary/' + source.sourceKey + '/';
          if (daimon.priority >= vocabularyPriority && authApi.hasSourceAccess(source.sourceKey)) {
            vocabularyPriority = daimon.priority;
            sharedState.vocabularyUrl(source.vocabularyUrl);
          }
        }

        // evaluate cem daimons
        if (daimon.daimonType == 'CEM') {
          source.hasEvidence = true;
          source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
          if (daimon.priority >= evidencePriority && authApi.hasSourceAccess(source.sourceKey)) {
            evidencePriority = daimon.priority;
            sharedState.evidenceUrl(source.evidenceUrl);
          }
        }

        // evaluate cem daimons
        if (daimon.daimonType == 'CEMResults') {
          source.hasCEMResults = true;
          source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
        }

        // evaluate results daimons
        if (daimon.daimonType == 'Results') {
          source.hasResults = true;
          source.resultsUrl = config.api.url + 'cdmresults/' + source.sourceKey + '/';
          if (daimon.priority >= densityPriority && authApi.hasSourceAccess(source.sourceKey)) {
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

      if (source.hasVocabulary && authApi.hasSourceAccess(source.sourceKey)) {
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

    sourceList = lodash.sortBy(sourceList, ['sourceName']);

    sharedState.sources(sourceList);
    if (config.cacheSources) {
      config.api.sources = sourceList;
      lscache.set(serviceCacheKey, config.api, 720);
    }
  }

  function checkSourceConnection(sourceKey) {
    return httpService.doGet(config.webAPIRoot + 'source/connection/' + sourceKey)
  }

  function refreshSourceCache(sourceKey) {
    return httpService.doGet(config.webAPIRoot + 'cdmresults/' + sourceKey + '/refreshCache');
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
    refreshSourceCache: refreshSourceCache,
    buttonCheckState: buttonCheckState,
    setSharedStateSources: setSharedStateSources,
    updateSourceDaimonPriority,
	};

	return api;
});
