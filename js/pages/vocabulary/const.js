define(
	(require, exports) => {
		const sharedState = require('atlas-state');

		const pageTitle = 'Search';
		const apiPaths = {
			domains: () => sharedState.vocabularyUrl() + 'domains',
			vocabularies: () => sharedState.vocabularyUrl() + 'vocabularies',
		};

		const importModes = {
			IDENTIFIERS: 'identifiers',
			SOURCE_CODES: 'sourcecodes',
			CONCEPT_SET: 'conceptset',
		};

		return {
			pageTitle,
			apiPaths,
			importModes,
		};
	}
);