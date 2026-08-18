define([
	'services/AuthAPI',
	'atlas-state',
], function (
	AuthAPI,
	sharedState,
) {
	return class PermissionService {

		static isPermittedGetInfo(sourceKey, conceptId) {
			return AuthAPI.hasSourceAccess(sourceKey);
		}

		static isPermittedGetRC(sourceKey) {
			return AuthAPI.hasSourceAccess(sourceKey);
		}

		static isPermittedLookupIds() {
			return this.isVocabularyUrlExists && AuthAPI.hasSourceAccess(sharedState.sourceKeyOfVocabUrl());
		}

		static get isVocabularyUrlExists() {
			return sharedState.vocabularyUrl() !== undefined;
		}

		static isPermittedLookupCodes() {
			return this.isVocabularyUrlExists && AuthAPI.hasSourceAccess(sharedState.sourceKeyOfVocabUrl());
		}
	}
});
