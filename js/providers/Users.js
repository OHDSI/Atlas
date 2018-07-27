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

  function searchGroups(provider, search) {
  	return $.ajax({
			url: config.webAPIRoot + 'user/import/' + provider + '/groups',
			method: 'GET',
			data: { search },
			error: authApi.handleAccessDenied,
		});
	}

  const api = {
    getAuthenticationProviders,
		searchGroups,
  };

  return api;
});