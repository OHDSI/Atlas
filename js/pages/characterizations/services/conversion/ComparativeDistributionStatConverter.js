define([
    './BaseDistributionStatConverter',
	'./DistributionStat',
], function (
    BaseDistributionStatConverter,
) {

    class ComparativeDistributionStatConverter extends BaseDistributionStatConverter {

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn('Count', 'count', strataId, cohortId),
                this.getDecimal2Column('Avg', 'avg', strataId, cohortId),
                this.getDecimal2Column('Std Dev', 'stdDev', strataId, cohortId),
                this.getDecimal2Column('Median', 'median', strataId, cohortId),
            ];
		}
    }

    return ComparativeDistributionStatConverter;
});
