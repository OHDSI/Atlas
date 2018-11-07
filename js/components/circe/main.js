define([
		'knockout',
		'./components/GenerateComponent',
		'./components/CohortConceptSetBrowser'
	],
	function (
		ko,
		generateComponent,
		cohortConceptSetBrowser
	) {
		
	ko.components.register('generate-component', generateComponent);	
	ko.components.register('cohort-concept-set-browser', cohortConceptSetBrowser);
	
});
