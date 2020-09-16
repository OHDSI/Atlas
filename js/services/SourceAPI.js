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

	const DAIMON_TYPE = {
	  CDM: 'CDM',
	  Vocabulary: 'Vocabulary',
	  Results: 'Results',
	  CEM: 'CEM',
	  CEMResults: 'CEMResults',
	  Temp: 'Temp'
    };

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
      if (sourceKey && parseInt(sourceKey) !== 0) {
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

  async function initSourcesConfig() {
    if (authApi.isPermittedGetSourceDaimonPriority()) {
      try {
        const [{data: sources}, {data: priorityDaimons}] = await Promise.all([
          httpService.doGet(config.api.url + 'source/sources'),
          httpService.doGet(config.api.url + 'source/daimon/priority'),
        ]);
        config.api.available = true;
            if (sources.length === 0) {
                return constants.applicationStatuses.noSourcesAvailable;
            }
            setSharedStateSources(sources, priorityDaimons);
            return constants.applicationStatuses.running;
      } catch (e) {
            if (e.status !== 403) {
              config.api.available = false;
              document.location = '#/configure';
            }
            return constants.applicationStatuses.failed;
      }
    } else {
      console.warn('There isn\'t permission to get source daimons priorities');
      return constants.applicationStatuses.running;
    }
  }

  function setSharedStateSources(sources, priorityDaimons) {
      sharedState.sources([]);
      const serviceCacheKey = getCacheKey();

      sharedState.vocabularyUrl() || (priorityDaimons[DAIMON_TYPE.Vocabulary] && sharedState.defaultVocabularyUrl(getVocabularyUrl(priorityDaimons[DAIMON_TYPE.Vocabulary].sourceKey)));
      sharedState.evidenceUrl() || priorityDaimons[DAIMON_TYPE.CEM] && sharedState.defaultEvidenceUrl(getEvidenceUrl(priorityDaimons[DAIMON_TYPE.CEM].sourceKey));
      sharedState.resultsUrl() || priorityDaimons[DAIMON_TYPE.Results] && sharedState.defaultResultsUrl(getResultsUrl(priorityDaimons[DAIMON_TYPE.Results].sourceKey));

      const sourceList = lodash.sortBy(sources.map(function (source, sourceIndex) {
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
      source.daimons.forEach(daimon => {

        // evaluate vocabulary daimons
        if (daimon.daimonType === DAIMON_TYPE.Vocabulary) {
          source.hasVocabulary = true;
          source.vocabularyUrl = getVocabularyUrl(source.sourceKey);
        }

        // evaluate cem daimons
        if (daimon.daimonType === DAIMON_TYPE.CEM) {
          source.hasEvidence = true;
          source.evidenceUrl = getEvidenceUrl(source.sourceKey);
        }

        // evaluate cem daimons
        if (daimon.daimonType === DAIMON_TYPE.CEMResults) {
          source.hasCEMResults = true;
          source.evidenceUrl = config.api.url + 'evidence/' + source.sourceKey + '/';
        }

        // evaluate results daimons
        if (daimon.daimonType === DAIMON_TYPE.Results) {
          source.hasResults = true;
          source.resultsUrl = getResultsUrl(source.sourceKey);
        }

        // evaluate cdm daimons
        if (daimon.daimonType === DAIMON_TYPE.CDM) {
          source.hasCDM = true;
        }
      });

      if (!source.hasVocabulary && source.hasCDM) {
          source.hasVocabulary = true;
          source.vocabularyUrl = getVocabularyUrl(source.sourceKey);
      }

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
        source.version = 'not available';
      }
      return source;
    }), ['sourceName']);

    sharedState.sources(sourceList);
    if (config.cacheSources) {
      config.api.sources = sourceList;
      lscache.set(serviceCacheKey, config.api.sources, 720);
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

  function getVocabularyUrl(sourceKey) {
      return config.api.url + 'vocabulary/' + sourceKey + '/';
  }

  function getEvidenceUrl(sourceKey) {
      return config.api.url + 'evidence/' + sourceKey + '/';
  }

  function getResultsUrl(sourceKey) {
      return config.api.url + 'cdmresults/' + sourceKey + '/';
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
