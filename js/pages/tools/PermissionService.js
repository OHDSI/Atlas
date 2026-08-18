define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedReadTools() {
			return AuthAPI.isPermitted('admin:tools');
		}

		static isPermittedCreateTool() {
			return AuthAPI.isPermitted('admin:tools');
		}

		static isPermittedUpdateTool() {
			return AuthAPI.isPermitted('admin:tools');
		}

		static isPermittedDeleteTool() {
			return AuthAPI.isPermitted('admin:tools');
		}
	}
});