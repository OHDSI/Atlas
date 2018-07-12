define(function(require, exports){

  var $ = require('jquery');
  var config = require('appConfig');
  var ohdsiUtil = require('assets/ohdsi.util');
  var authApi = require('webapi/AuthAPI');
  var momentApi = require('webapi/MomentAPI');

  const executionPath  = 'executionservice';
  
  function runExecution(sourceKey, analysisId, analysisType, template, successHandler){
    return ohdsiUtil.cachedAjax({
      url: `${config.api.url}${executionPath}/execution/run`,
      method: 'POST',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
      data: JSON.stringify({
        'template': template,
        'sourceKey': sourceKey,
        'exposureTable': 'exposure_table',
        'outcomeTable': 'outcome',
        'cdmVersion': 5,
        'workFolder': 'workfolder',
        'analysisType': analysisType,
        'cohortId': analysisId,
      }),
      success: successHandler,
    });
  }

  function loadExecutions(analysisType, analysisId,  callback){
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

	function getEngineStatus(callback) {
		return $.ajax({
			url: `${config.api.url}${executionPath}/status`,
			method: 'GET',
			contentType: 'application/json',
			error: authApi.handleAccessDenied,
      success: callback
		});
  }

  function viewResults(executionId){
    window.open(`${config.api.url}${executionPath}/execution/results/${executionId}`);
  }

  function checkExecutionEngineStatus(isAuthenticated) {
    if (isAuthenticated && config.useExecutionEngine) {
      getEngineStatus(v => {
        config.api.isExecutionEngineAvailable(v.status === 'ONLINE')
      });
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