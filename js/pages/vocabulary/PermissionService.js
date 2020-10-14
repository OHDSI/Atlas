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
		
    return {
    	isPermittedSearch,
    }
});