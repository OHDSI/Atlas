define(function (require, exports) {

  const Service = require('providers/Service');
  const config = require('appConfig');

  class ProfileService extends Service {
    async find(sourceKey, personId, cohort) {
      const params = {
        cohort: cohort || 0,
      };
      const { data } = await this.httpService.doGet(`${config.api.url}${sourceKey}/person/${personId}`, params);
      return data;
    };

  }

  return new ProfileService();
});