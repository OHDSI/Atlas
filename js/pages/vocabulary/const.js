define(
	(require, exports) => {
		const sharedState = require('atlas-state');

		const pageTitle = 'Search';
		const apiPaths = {
			domains: () => sharedState.vocabularyUrl() + 'domains',
			vocabularies: () => sharedState.vocabularyUrl() + 'vocabularies',
		};
		
		return {
			pageTitle,
			apiPaths,
		};
	}
);