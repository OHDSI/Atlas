define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedReadTools() {
			return AuthAPI.isPermitted('tool:get');
		}

		static isPermittedCreateTool() {
			return AuthAPI.isPermitted('tool:post');
		}

		static isPermittedUpdateTool() {
			return AuthAPI.isPermitted('tool:put');
		}

		static isPermittedDeleteTool() {
			return AuthAPI.isPermitted('tool:*:delete');
		}
	}
});