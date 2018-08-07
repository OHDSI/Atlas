define(function(require, exports) {

  var config = require('appConfig');
  const httpService = require('services/http');

  function updateRoles() {
    return httpService.doGet(config.api.url + 'role');
  }

  var api = {
    updateRoles: updateRoles,
  };

  return api;
});