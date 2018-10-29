define(function (require, exports) {
	
	var ko = require('knockout')
	
	var generateComponent = require('./components/GenerateComponent');
	ko.components.register('generate-component', generateComponent);
	
	var cohortConceptSetBrowser = require('./components/CohortConceptSetBrowser');
	ko.components.register('cohort-concept-set-browser', cohortConceptSetBrowser);
	
});
