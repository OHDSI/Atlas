define(function (require, exports) {

	const ko = require('knockout');
	const config = require('appConfig');
	const httpService = require('services/http');
	const authApi = require('services/AuthAPI');

	async function loadRoleSuggestions(roleSearch) {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/suggest`, { roleSearch });
		return res.data;
	}

	async function loadEntityAccessList(entityType, entityId, perm_type = 'WRITE') {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/${entityType}/${entityId}/${perm_type}`);
		return res.data;
	}

	function grantEntityAccess(entityType, entityId, roleId, perm_type = 'WRITE') {
		return httpService.doPost(
			config.webAPIRoot + `permission/access/${entityType}/${entityId}/role/${roleId}`,
			{
				accessType: perm_type
			}
		);
	}

        function revokeEntityAccess(entityType, entityId, roleId, perm_type = 'WRITE') {
	    return httpService.doDelete(
			config.webAPIRoot + `permission/access/${entityType}/${entityId}/role/${roleId}`,
			{
				accessType: perm_type
			}
		    );
	}

	function decorateComponent(component, { entityTypeGetter, entityIdGetter, createdByUsernameGetter }) {

		component.isAccessModalShown = ko.observable(false);

		component.isOwnerFn = (username) => {
			return createdByUsernameGetter() === username;
		};

		component.isOwner = ko.computed(() => config.userAuthenticationEnabled && component.isOwnerFn(authApi.subject()));

		component.loadAccessList = (perm_type='WRITE') => {
 		        return loadEntityAccessList(entityTypeGetter(), entityIdGetter(), perm_type);
		};

	        component.grantAccess = (roleId, perm_type='WRITE') => {
		        return grantEntityAccess(entityTypeGetter(), entityIdGetter(), roleId, perm_type);
		};

	        component.revokeAccess = (roleId, perm_type='WRITE') => {
		        return revokeEntityAccess(entityTypeGetter(), entityIdGetter(), roleId, perm_type);
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

