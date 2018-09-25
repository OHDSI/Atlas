define(function (require, exports) {

	var Service = require('providers/Service');
	var config = require('appConfig');
  const { visualizationPacks } = require('const');

  
  class CohortReportingService extends Service {
    getAnalysisIdentifiers() {
      var identifiers = [];
      Object.values(visualizationPacks).forEach(v => {
        v.analyses.forEach(a => {
          identifiers.push(a);
        });
      });
      return identifiers;
    }
  
    getQuickAnalysisIdentifiers() {
      return visualizationPacks.default.analyses
        .concat(visualizationPacks.person.analyses)
        .concat(visualizationPacks.conditionEras.analyses)
        .concat(visualizationPacks.drugEras.analyses)
        .concat(visualizationPacks.procedure.analyses)
        .concat(visualizationPacks.tornado.analyses)
        .filter((d,i, arr) => arr.indexOf(d) == i);
    }

    getHealthcareAnalysesIdentifiers() {
      return this.getAnalysisIdentifiers().filter(id => id >= 4000 && id < 4100);
    }

    getAvailableReports(completedAnalyses) {
      var reports = [];
      if (completedAnalyses.length == 0) {
        return reports;
      }
  
      Object.values(visualizationPacks).forEach(vp => {
        if (vp.reportKey == null) {
          // null report keys won't be listed as available reports
          // but we keep them as their analysis identifiers are still necessary
          // for the analysis to complete
          return;
        }
        var analysisMissing = false;
        vp.analyses.forEach(a => {
          if (completedAnalyses.indexOf(a) == -1) {
            analysisMissing = true;
          };
        });
        if (!analysisMissing) {
          reports.push(vp);
        }
      });
      return reports;
    }

    async getCompletedAnalyses(source, cohortDefinitionId) {
      const { data } = await this.httpService.doGet(config.api.url + 'cohortresults/' + source.sourceKey + '/' + cohortDefinitionId + '/analyses');
      return data;
    }
  
    async getCompletedHeraclesHeelAnalyses(source, cohortDefinitionId) {
      const { data } = await this.httpService.doGet(config.api.url + 'cohortresults/' + source.sourceKey + '/' + cohortDefinitionId + '/heraclesheel?refresh=true');
      return data;
    }
  }	

	return new CohortReportingService();
});
