define([
	'services/AuthAPI',
], function (
	AuthAPI,
) {
	return class PermissionService {

		static isPermittedGetInfo(sourceKey, conceptId) {
			return AuthAPI.isPermitted(`vocabulary:${sourceKey}:concept:${conceptId}:get`);
		}

		static isPermittedGetRC(sourceKey) {
			return AuthAPI.isPermitted(`cdmresults:${sourceKey}:conceptRecordCount:post`);
		}
	}
});
