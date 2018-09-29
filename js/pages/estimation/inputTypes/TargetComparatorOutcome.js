define(function (require, exports) {

    var ko = require('knockout');
    var Cohort = require('./Cohort');

	function TargetComparatorOutcome(data) {
		var self = this;
        data = data || {};

        self.target = data.target || new Cohort();
        self.comparator = data.comparator || new Cohort();
        self.outcome = data.outcome || new Cohort();
	}
	
	return TargetComparatorOutcome;
});