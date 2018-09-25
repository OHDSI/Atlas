define(function(require, exports){

  const config = require('appConfig');
  const momentApi = require('webapi/MomentAPI');
  const CRUDService = require('providers/CRUDService');
  const { apiPaths } = require('const');

  class ExecutionService extends CRUDService {
    async run(sourceKey, analysisId, analysisType, template) {
      const params = {
        'template': template,
        'sourceKey': sourceKey,
        'exposureTable': 'exposure_table',
        'outcomeTable': 'outcome',
        'cdmVersion': 5,
        'workFolder': 'workfolder',
        'analysisType': analysisType,
        'cohortId': analysisId,
      };
      const { data } = await this.httpService.doPost(`${this.baseUrl}/execution/run`, params);
      return data;
    }

    async find(analysisType, analysisId) {
      const response = await super.find(analysisType, analysisId, 'executions');
      response
        .sort((a, b) => a.executed - b.executed)
        .map((d) => {
          var executedTimestamp = new Date(d.executed);
          d.executedCaption = momentApi.formatDateTime(executedTimestamp);
  
          if (d.duration > 0) {
            d.durationCaption = momentApi.formatDuration(d.duration * 1000);
          } else {
            d.durationCaption = 'n/a';
          }

          return d;
        });

      return response;
    }

    async getEngineStatus() {
      const { data } = await httpService.doGet(`${this.baseUrl}/status`);
      return data;
    }

    viewResults(executionId){
      window.open(`${this.baseUrl}/execution/results/${executionId}`);
    }
  
    async checkExecutionEngineStatus(isAuthenticated) {
      if (isAuthenticated && config.useExecutionEngine) {
        const { data: v } = await this.getEngineStatus();
        const isAvailable = v.status === 'ONLINE';
        config.api.isExecutionEngineAvailable(isAvailable);
        
        return isAvailable;
      }
      return config.api.isExecutionEngineAvailable();
    }
  }  

  return new ExecutionService(apiPaths.execution());
});