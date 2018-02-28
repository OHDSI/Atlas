define(function(require, exports){

  var $ = require('jquery');
  var config = require('appConfig');
  var ohdsiUtil = require('ohdsi.util');
  var authApi = require('webapi/AuthAPI');
  var momentApi = require('webapi/MomentAPI');

  function runExecution(sourceKey, analysisId, analysisType, template, successHandler){
    ohdsiUtil.cachedAjax({
      url: config.api.url + 'execution_service/run_script',
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
      url: config.api.url + 'execution_service/' + analysisType + '/' + analysisId + '/executions',
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

  function viewResults(executionId){
    window.open(config.api.url + 'execution_service/execution/results/' + executionId);
  }

  var api = {
    runExecution: runExecution,
    loadExecutions: loadExecutions,
    viewResults: viewResults,
  };

  return api;
});