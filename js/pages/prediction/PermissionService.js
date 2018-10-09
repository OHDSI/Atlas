define([
	'webapi/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedCreate() {
			return AuthAPI.isPermitted(`prediction:post`);
		}

		static isPermittedList() {
			return AuthAPI.isPermitted(`prediction:get`);
		}

		static isPermittedLoad(id) {
			return AuthAPI.isPermitted(`prediction:${id}:get`);
		}

		static isPermittedUpdate(id) {
			return AuthAPI.isPermitted(`prediction:${id}:put`);
		}

		static isPermittedDelete(id) {
			return AuthAPI.isPermitted(`prediction:${id}:delete`);
		}

		static isPermittedCopy(id) {
			return AuthAPI.isPermitted(`prediction:${id}:copy:get`);
		}

		static isPermittedDownload(id) {
			return AuthAPI.isPermitted(`prediction:${id}:download:get`);
		}

		static isPermittedExport(id) {
			return AuthAPI.isPermitted(`prediction:${id}:export:get`);
		}
	}
});
