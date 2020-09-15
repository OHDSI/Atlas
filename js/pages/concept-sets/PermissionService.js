define([
	'services/AuthAPI',
	'atlas-state',
], function (
	AuthAPI,
	sharedState,
) {
	return class PermissionService {

		static isPermittedGetInfo(sourceKey, conceptId) {
			return AuthAPI.isPermitted(`vocabulary:${sourceKey}:concept:${conceptId}:get`);
		}

		static isPermittedGetRC(sourceKey) {
			return AuthAPI.isPermitted(`cdmresults:${sourceKey}:conceptRecordCount:post`);
		}

		static isPermittedLookupIds() {
			return this.isVocabularyUrlExists && AuthAPI.isPermitted(`vocabulary:${sharedState.sourceKeyOfVocabUrl()}:lookup:identifiers:post`);
		}

		static get isVocabularyUrlExists() {
			return sharedState.vocabularyUrl() !== undefined;
		}

		static isPermittedLookupCodes() {
			return this.isVocabularyUrlExists && AuthAPI.isPermitted(`vocabulary:${sharedState.sourceKeyOfVocabUrl()}:lookup:sourcecodes:post`);
		}
	}
});
