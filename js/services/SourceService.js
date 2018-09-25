define(function (require, exports) {

	const CRUDService = require('providers/CRUDService');
  const { apiPaths, connectionCheckState } = require('const');  
	var config = require('appConfig');
	var sharedState = require('atlas-state');
	var ohdsiUtil = require('assets/ohdsi.util');
	var authApi = require('webapi/AuthAPI');
  var lscache = require('lscache');
  var ko = require('knockout');

  function getCacheKey() {
    return 'ATLAS|' + config.api.url;
  }
  
  class SourceService extends CRUDService {
    get connectionCheckState() {
      return connectionCheckState;
    }

    async find() {
      return await super.find('sources');
    }
    
    async save(sourceKey, source) {
        var formData = new FormData();
        formData.append("keytab", source.keytab);
        formData.append("source", new Blob([JSON.stringify(source)],{type: "application/json"}));
  
        lscache.remove(getCacheKey());
        if (sourceKey) {
          return await this.httpService.doPut(`${this.baseUrl}/${sourceKey}`, formData);
        } else {
          return await this.httpService.doPost(this.baseUrl, formData);
        }
    }

    async findOne(sourceKey) {
      const { data } = await this.httpService.doGet(`${this.baseUrl}/details/${sourceKey}`);
      return data;
    }

    async delete(sourceKey) {
      lscache.remove(getCacheKey());
      return super.delete(sourceKey);
    }

    async initSourcesConfig() {
      try {
        const sources = await this.find();      
        config.api.available = true;
        await this.setSharedStateSources(sources);
      } catch (err) {
        config.api.available = false;
        config.api.thrownError = err;
        sharedState.appInitializationStatus('failed');
        document.location = '#/configure';
      }
    }

    setSharedStateSources(sources) {
      sharedState.sources([]);
      var serviceCacheKey = getCacheKey();
      var sourceList = [];
      var evidencePriority = 0;
      var vocabularyPriority = 0;
      var densityPriority = 0;
  
      $.each(sources, async function (sourceIndex, source) {
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
          try {
            const { data: info } = await this.httpService.doGet(`${config.api.url}vocabulary/${source.sourceKey}/info`);          
              source.version(info.version);
              source.dialect(info.dialect);
            } catch(err) {
              source.version('unknown');
              source.dialect('unknown');
              source.url = `${config.api.url}${source.sourceKey}/`;
            }
        } else {
          source.version = 'not available';
        }
      });
  
      sharedState.sources(sourceList);
      if (config.cacheSources) {
        config.api.sources = sourceList;
        lscache.set(serviceCacheKey, config.api, 720);
      }
    }

    async checkSourceConnection(sourceKey) {
      const { data } = await httpService.doGet(`${this.baseUrl}connection/${sourceKey}`);
      return data;
    }
  
    async updateSourceDaimonPriority(sourceKey, daimonType) {
      const { data } = await httpService.doPost(`${this.baseUrl}${sourceKey}/daimons/${daimonType}/set-priority`);
      return data;
    }
  }

	return new SourceService(apiPaths.source());
});
