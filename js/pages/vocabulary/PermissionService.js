define([
    'services/AuthAPI',
	'atlas-state',
], function (
	AuthAPI,
	sharedState,
) {
	function getSourceKeyOfVocabUrl() {
		return sharedState.vocabularyUrl().replace(/\/$/, '').split('/').pop();
	}

	const isPermittedSearch = () => {
		return sharedState.vocabularyUrl() !== undefined && AuthAPI.isPermitted(`vocabulary:${getSourceKeyOfVocabUrl()}:search:*:get`);
    };

    return {
    	isPermittedSearch,
    }
});