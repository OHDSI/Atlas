define(function (require, exports) {

  const httpService = require('services/http');
  const config = require('appConfig');
  const constants = require('const');

  return class JobsService {
    static getList() {
      return httpService.doGet(constants.apiPaths.jobs())
				.then(({ data: jobs } = { data: { content: [] } }) => jobs.content);
    }

    static get(id) {
	    return httpService.doGet(constants.apiPaths.job(id));
    }

    static getByName(name, type) {
	    return httpService.doGet(constants.apiPaths.jobByName(name,  type));
    }
  }
});