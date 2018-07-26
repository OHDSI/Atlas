define(function (require, exports) {

	var ko = require('knockout')
	
	var cohortFeatureBrowser = require('./components/CohortFeatureBrowser');
	ko.components.register('cohort-feature-browser', cohortFeatureBrowser);
	
});
