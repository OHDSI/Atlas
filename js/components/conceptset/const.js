define([
	'knockout'
], function(ko) {

	const importTypes = {
		OVERWRITE: 'overwrite',
		APPEND: 'append',
  };

	const ViewMode = {
		EXPRESSION: 'expression',
		INCLUDED: 'included',
		SOURCECODES: 'included-sourcecodes',
		RECOMMEND: 'recommend',
		EXPORT: 'conceptset-export',
		IMPORT: 'conceptset-import',
	};
	
	const ConceptSetSources = {
		featureAnalysis: 'featureAnalysis',
		repository: 'repository',
		cohortDefinition: 'cohortDefinition',
		characterization: 'characterization',
		incidenceRates: 'incidenceRates',
		reusables: 'reusables'
	};
	
	const RESOLVE_OUT_OF_ORDER = 'resolveConceptSetExpression() resolved out of order';

	return {
		importTypes,
		ViewMode,
		ConceptSetSources,
		RESOLVE_OUT_OF_ORDER,
	};

});