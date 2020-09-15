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
		EXPORT: 'conceptset-export',
		IMPORT: 'conceptset-import',
	};
	
	const ConceptSetSources = {
		featureAnalysis: 'featureAnalysis',
		repository: 'repository',
		cohortDefinition: 'cohortDefinition',
		characterization: 'characterization',
		incidenceRates: 'incidenceRates',
	};
	
	const RESOLVE_OUT_OF_ORDER = 'resolveConceptSetExpression() resolved out of oder';

	return {
		importTypes,
		ViewMode,
		ConceptSetSources,
		RESOLVE_OUT_OF_ORDER,
	};

});