define(function (require, exports) {

	const config = require('appConfig');
	const httpService = require('services/http');

	async function loadRoleSuggestions(roleSearch) {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/suggest`, { roleSearch });
		return res.data;
	}

	async function loadEntityAccessList(entityType, entityId) {
		const res = await httpService.doGet(config.webAPIRoot + `permission/access/${entityType}/${entityId}`);
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

    return {
		loadEntityAccessList,
		grantEntityAccess,
		revokeEntityAccess,
		loadRoleSuggestions,
	};
});

