define(function (require, exports) {

  const httpService = require('services/http');
  const config = require('appConfig');
  const authApi = require('services/AuthAPI');

  const getProfile = function(sourceKey, personId, cohort) {
    const data = {
      cohort: cohort || 0,
    };
    const response = httpService.doGet(`${config.webAPIRoot}${sourceKey}/person/${personId}`, data).then(({ data }) => data);
    response.catch((er) => {
      console.error('Can\'t find person');
    });

    return response;
  };

  return {
    getProfile,
  };
});