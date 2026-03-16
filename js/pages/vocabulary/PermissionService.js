define([
    'services/AuthAPI',
		'atlas-state',
], function (
	AuthAPI,
	sharedState,
) {
	const isPermittedSearch = () => {
		return sharedState.vocabularyUrl() !== undefined && AuthAPI.hasSourceAccess(sharedState.sourceKeyOfVocabUrl());
	};
		
	return {
		isPermittedSearch,
	}
});