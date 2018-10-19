define([
	'webapi/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedCreate() {
			return AuthAPI.isPermitted(`estimation:post`);
		}

		static isPermittedList() {
			return AuthAPI.isPermitted(`estimation:get`);
		}

		static isPermittedLoad(id) {
			return AuthAPI.isPermitted(`estimation:${id}:get`);
		}

		static isPermittedUpdate(id) {
			return AuthAPI.isPermitted(`estimation:${id}:put`);
		}

		static isPermittedDelete(id) {
			return AuthAPI.isPermitted(`estimation:${id}:delete`);
		}

		static isPermittedCopy(id) {
			return AuthAPI.isPermitted(`estimation:${id}:copy:get`);
		}

		static isPermittedDownload(id) {
			return AuthAPI.isPermitted(`estimation:${id}:download:get`);
		}

		static isPermittedExport(id) {
			return AuthAPI.isPermitted(`estimation:${id}:export:get`);
		}
	}
});
