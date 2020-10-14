define([
	'services/AuthAPI',
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

		static isPermittedGenerate(id, sourceKey) {
			return AuthAPI.isPermitted(`prediction:${id}:generation:*:post`) && AuthAPI.isPermitted(`source:${sourceKey}:access`);
		}

		static isPermittedListGenerations(id) {
			return AuthAPI.isPermitted(`prediction:${id}:generation:get`);
		}

		static isPermittedResults(id) {
			return AuthAPI.isPermitted(`prediction:generation:${id}:result:get`);
		}

		static isPermittedImport() {
			return AuthAPI.isPermitted(`prediction:import:post`);
		}
	}
});
