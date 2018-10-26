define(function (require, exports) {

  const $ = require('jquery');
  const config = require('appConfig');
  const authApi = require('services/AuthAPI');
  const ko = require('knockout');
  const httpService = require('./http');

  const importRoot = config.webAPIRoot + 'user/import';
  const importProvider = provider => importRoot + '/' + provider;
  const startImport = (provider, preserve) => importRoot + `?provider=${provider}`
		+ (preserve ? `&preserve=${preserve}` : '');

  function getAuthenticationProviders() {
  	return httpService.doGet(config.webAPIRoot + 'user/providers');
  }

  function searchGroups(provider, search) {
  	return httpService.doGet(importProvider(provider) + '/groups', { search });
	}

	function searchUsers(provider, mapping) {
	 	return httpService.doPost(importProvider(provider), ko.toJS(mapping));
	}

	function importUsers(users, provider, preserve) {
  	return httpService.doPost(startImport(provider, preserve || true), users);
	}

	function saveMapping(provider, mapping) {
  	return httpService.doPost(importProvider(provider) + '/mapping', ko.toJS(mapping));
	}

	function getMapping(provider) {
  	return httpService.doGet(importProvider(provider) + '/mapping');
	}

	function getUsers() {
		return httpService.doGet(config.webAPIRoot + 'user');
	}

	function testConnection(provider) {
  	return httpService.doGet(importProvider(provider) + '/test');
	}

	function entity(method) {
	 	return (...params) => method(...params).then(response => response.data);
	}

	const api = {
		getAuthenticationProviders: entity(getAuthenticationProviders),
		searchGroups: entity(searchGroups),
		searchUsers: entity(searchUsers),
		importUsers: entity(importUsers),
		saveMapping: entity(saveMapping),
		getMapping: entity(getMapping),
		getUsers: entity(getUsers),
		testConnection: entity(testConnection),
	};

  return api;
});