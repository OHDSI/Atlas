define([
    'services/AuthAPI',
	'atlas-state',
], function (
	AuthAPI,
	sharedState,
) {
	const isPermittedSearch = () => {
		return sharedState.vocabularyUrl() !== undefined && AuthAPI.isPermitted(`vocabulary:${sharedState.sourceKeyOfVocabUrl()}:search:*:get`);
    };

	const isPermittedLookupIds = () => {
		return sharedState.vocabularyUrl() !== undefined && AuthAPI.isPermitted(`vocabulary:${sharedState.sourceKeyOfVocabUrl()}:lookup:identifiers:post`);
    };

    const isPermittedLookupCodes = () => {
		return sharedState.vocabularyUrl() !== undefined && AuthAPI.isPermitted(`vocabulary:${sharedState.sourceKeyOfVocabUrl()}:lookup:sourcecodes:post`);
    };

    return {
    	isPermittedSearch,
    	isPermittedLookupIds,
    	isPermittedLookupCodes,
    }
});