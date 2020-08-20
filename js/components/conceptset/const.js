define([
	'knockout'
], function(ko) {

	const ConceptSetTabKeys = {
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
		ConceptSetTabKeys,
		ConceptSetSources,
		RESOLVE_OUT_OF_ORDER,
	};

});