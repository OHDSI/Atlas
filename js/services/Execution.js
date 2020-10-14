define(function(require, exports){

  const config = require('appConfig');
  const ohdsiUtil = require('assets/ohdsi.util');
  const authApi = require('services/AuthAPI');
  const momentApi = require('services/MomentAPI');
  const httpService = require('services/http');

  const executionPath  = 'executionservice';
  
  function runExecution(sourceKey, analysisId, analysisType, template) {
    const data = {
      'template': template,
      'sourceKey': sourceKey,
      'exposureTable': 'exposure_table',
      'outcomeTable': 'outcome',
      'cdmVersion': 5,
      'workFolder': 'workfolder',
      'analysisType': analysisType,
      'cohortId': analysisId,
    };
    return httpService.doPost(`${config.api.url}${executionPath}/execution/run`, data);
  }

  function loadExecutions(analysisType, analysisId,  callback) {
    ohdsiUtil.cachedAjax({
      url: `${config.api.url}${executionPath}/${analysisType}/${analysisId}/executions`,
      method: 'GET',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
      success: function (response) {

        response = response.sort(function (a, b) {
          return a.executed - b.executed;
        });

        $.each(response, function (i, d) {
          var executedTimestamp = new Date(d.executed);
          d.executedCaption = momentApi.formatDateTime(executedTimestamp);

          if (d.duration > 0) {
            d.durationCaption = momentApi.formatDuration(d.duration * 1000);
          } else {
            d.durationCaption = 'n/a';
          }
          callback(d);
        });
      }
    });
  }

	function getEngineStatus() {
    return httpService.doGet(`${config.api.url}${executionPath}/status`);
  }

  function viewResults(executionId){
    window.open(`${config.api.url}${executionPath}/execution/results/${executionId}`);
  }

  function checkExecutionEngineStatus(isAuthenticated) {
    if (authApi.isPermittedGetExecutionService()) {
      if (isAuthenticated && config.useExecutionEngine) {
        getEngineStatus().then(({ data: v }) => {
          config.api.isExecutionEngineAvailable(v.status === 'ONLINE')
        });
      }  
    } else {
      console.warn('There isn\'t permission to get execution engine status');
    }
  }

  const api = {
    runExecution: runExecution,
    loadExecutions: loadExecutions,
    viewResults: viewResults,
		getEngineStatus: getEngineStatus,
    executionPath: executionPath,
    checkExecutionEngineStatus,
  };

  return api;
});