define([
], function () {

    class PrevalenceStat {

		constructor(stat) {
			this.analysisId = stat.analysisId;
			this.analysisName = stat.analysisName;
			this.covariateId = stat.covariateId;
			this.covariateName = stat.covariateName;
			this.domainId = stat.domainId;
			this.cohorts = [];
			this.count = {};
			this.pct = {};
		}
    }

    return PrevalenceStat;
});
