define(function(require, exports) {

  var $ = require('jquery');
  var config = require('appConfig');
  var authApi = require('services/auth');
  var sharedState = require('atlas-state');

  var self  = this;
  self.roles = sharedState.roles;

  function updateRoles() {
    return $.ajax({
      url: config.webAPIRoot + 'role',
      method: 'GET',
      contentType: 'application/json',
      error: authApi.handleAccessDenied,
      success: function (data) {
        self.roles(data);
      }
    });
  }

  var api = {
    updateRoles: updateRoles,
  };

  return api;
});