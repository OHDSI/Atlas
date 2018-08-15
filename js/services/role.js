define(function(require, exports) {

  var config = require('appConfig');
  const httpService = require('services/http');

  function getRoles() {
    return httpService.doGet(config.api.url + 'role');
  }

  var api = {
    getRoles: getRoles,
  };

  return api;
});