define([
	'knockout',
    './BaseDistributionStatConverter',
	'./DistributionStat',
], function (
		ko,
    BaseDistributionStatConverter,
) {

    class ComparativeDistributionStatConverter extends BaseDistributionStatConverter {

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn(ko.i18n(this.columnKey('count'), 'Count'), 'count', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('avg'), 'Avg'), 'avg', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('stdev'), 'Std Dev'), 'stdDev', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('median'), 'Median'), 'median', strataId, cohortId),
            ];
		}
    }

    return ComparativeDistributionStatConverter;
});
