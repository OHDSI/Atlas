define(['atlas-state'],
	(sharedState) => {

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