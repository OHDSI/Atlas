define(function (require, exports) {

  const CRUDService = require('providers/CRUDService');
  const { apiPaths } = require('const');

  class JobsService extends CRUDService {}

  return new JobsService(apiPaths.jobs());
});