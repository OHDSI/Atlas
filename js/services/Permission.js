define(function (require, exports) {

	const ko = require('knockout');
	const config = require('appConfig');
	const httpService = require('services/http');
	const authApi = require('services/AuthAPI');

	async function loadRoleSuggestions(roleSearch) {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/suggest`, { roleSearch });
		return res.data;
	}

       async function loadEntityAccessList(entityType, entityId, role = 'WRITE') {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/${entityType}/${entityId}/${role}`);
		return res.data;
	}

	function grantEntityAccess(entityType, entityId, roleId) {
		return httpService.doPost(
			config.webAPIRoot + `permission/access/${entityType}/${entityId}/role/${roleId}`,
			{
				accessType: 'WRITE'
			}
		);
	}

	function revokeEntityAccess(entityType, entityId, roleId) {
		return httpService.doDelete(
			config.webAPIRoot + `permission/access/${entityType}/${entityId}/role/${roleId}`,
			{
				accessType: 'WRITE'
			}
		);
	}

	function decorateComponent(component, { entityTypeGetter, entityIdGetter, createdByUsernameGetter }) {

		component.isAccessModalShown = ko.observable(false);

		component.isOwnerFn = (username) => {
			return createdByUsernameGetter() === username;
		};

		component.isOwner = ko.computed(() => config.userAuthenticationEnabled && component.isOwnerFn(authApi.subject()));

		component.loadAccessList = (role='WRITE') => {
 		        return loadEntityAccessList(entityTypeGetter(), entityIdGetter(), role);
		};

		component.grantAccess = (roleId) => {
			return grantEntityAccess(entityTypeGetter(), entityIdGetter(), roleId);
		};

		component.revokeAccess = (roleId) => {
			return revokeEntityAccess(entityTypeGetter(), entityIdGetter(), roleId);
		};

		component.loadAccessRoleSuggestions = (searchStr) => {
			return loadRoleSuggestions(searchStr);
		};
	}

    return {
		loadEntityAccessList,
		grantEntityAccess,
		revokeEntityAccess,
		loadRoleSuggestions,
		decorateComponent,
	};
});

