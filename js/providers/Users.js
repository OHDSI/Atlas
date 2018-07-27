define(function (require, exports) {

  const $ = require('jquery');
  const config = require('appConfig');
  const authApi = require('webapi/AuthAPI');
  const ko = require('knockout');

  const importRoot = config.webAPIRoot + 'user/import';
  const importProvider = provider => importRoot + '/' + provider;

  function getAuthenticationProviders() {
    return $.ajax({
      url: config.webAPIRoot + 'user/providers',
      method: 'GET',
      error: authApi.handleAccessDenied,
    });
  }

  function searchGroups(provider, search) {
  	return $.ajax({
			url: importProvider(provider) + '/groups',
			method: 'GET',
			data: { search },
			error: authApi.handleAccessDenied,
		});
	}

	function searchUsers(provider, mapping) {
  	return $.ajax({
			url: importProvider(provider),
			method: 'POST',
			contentType: 'application/json',
			data: ko.toJSON(mapping),
			error: authApi.handleAccessDenied,
		});
	}

	function importUsers(users) {
  	return $.ajax({
			url: importRoot,
			method: 'POST',
			contentType: 'application/json',
			data: ko.toJSON(users),
			error: authApi.handleAccessDenied,
		});
	}

	function saveMapping(provider, mapping) {
  	return $.ajax({
			url: importProvider(provider) + '/mapping',
			method: 'POST',
			contentType: 'application/json',
			data: ko.toJSON(mapping),
			error: authApi.handleAccessDenied,
		});
	}

	function getMapping(provider) {
  	return $.ajax({
			url: importProvider(provider) + '/mapping',
			method: 'GET',
			error: authApi.handleAccessDenied,
		});
	}

  const api = {
    getAuthenticationProviders,
		searchGroups,
		searchUsers,
		importUsers,
		saveMapping,
		getMapping,
  };

  return api;
});