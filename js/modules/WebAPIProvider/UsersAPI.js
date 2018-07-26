define(function (require, exports) {

  const $ = require('jquery');
  const config = require('appConfig');
  const authApi = require('webapi/AuthAPI');

  function getAuthenticationProviders() {
    return $.ajax({
      url: config.webAPIRoot + 'user/providers',
      method: 'GET',
      error: authApi.handleAccessDenied,
    });
  }

  const api = {
    getAuthenticationProviders,
  };

  return api;
});