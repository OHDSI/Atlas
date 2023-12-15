define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedCreate() {
			return AuthAPI.isPermitted(`admin:post`);
		}

		static isPermittedList() {
			return AuthAPI.isPermitted(`admin:get`);
		}
	}
});
