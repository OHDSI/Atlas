define(function (require, exports) {

  const config = require('appConfig');
  const ko = require('knockout');
	const CRUDService = require('providers/CRUDService');
	const { apiPaths } = require('const');

  const importRoot = config.api.url + 'user/import';
  const importProvider = provider => importRoot + '/' + provider;

	class UserService extends CRUDService {
		async getAuthenticationProviders() {
			const { data } = await httpService.doGet(config.api.url + 'user/providers');
			return data;
		}
	
		async searchGroups(provider, search) {
			const { data } = await httpService.doGet(importProvider(provider) + '/groups', { search });
			return data;
		}
	
		async searchUsers(provider, mapping) {
			 const { data } = await httpService.doPost(importProvider(provider), ko.toJS(mapping));
			 return data;
		}
	
		async importUsers(users) {
			const { data } = await httpService.doPost(importRoot, users);
			return data;
		}
	
		async saveMapping(provider, mapping) {
			const { data } = await httpService.doPost(importProvider(provider) + '/mapping', ko.toJS(mapping));
			return data;
		}
	
		async getMapping(provider) {
			const { data } = await httpService.doGet(importProvider(provider) + '/mapping');
			return data;
		}
	
		async testConnection(provider) {
			const { data } = await httpService.doGet(importProvider(provider) + '/test');
			return data;
		}
	}

  return new UserService(apiPaths.users());
});