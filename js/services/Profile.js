define(function (require, exports) {

  const httpService = require('services/http');
  const config = require('appConfig');
  const authApi = require('webapi/AuthAPI');

  const getProfile = function(sourceKey, personId, cohort) {
    const data = {
      cohort: cohort || 0,
    };
    const response = httpService.doGet(`${config.webAPIRoot}${sourceKey}/person/${personId}`, data);
    response.catch(er => authApi.handleUnauthorized(er));

    return response;
  };

  return {
    getProfile,
  };
});