define([
    'services/analysis/Cohort'
], function (
    Cohort
) {
	class TargetComparatorOutcome {
        constructor(data = {}) {
            this.target = data.target || new Cohort();
            this.comparator = data.comparator || new Cohort();
            this.outcome = data.outcome || new Cohort();
        }
	}
	
	return TargetComparatorOutcome;
});