define(function (require, exports) {

  var $ = require('jquery');
  var config = require('appConfig');
  var authApi = require('webapi/AuthAPI');

  var getProfile = function(sourceKey, personId, cohort){
    return $.ajax({
      url: config.webAPIRoot + sourceKey + '/person/' + personId,
      method: 'GET',
      contentType: 'application/json',
      data: {
        cohort,
      },
      error: authApi.handleAccessDenied,
    });
  };

  return {
    getProfile,
  };
});