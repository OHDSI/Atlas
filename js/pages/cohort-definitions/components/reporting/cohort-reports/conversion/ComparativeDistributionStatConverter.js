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
                this.getCountColumn(ko.i18n('columns.personsCount', 'Persons'), 'count', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.avg', 'Avg'), 'avg', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.stddev', 'Std Dev'), 'stdDev', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.median', 'Median'), 'median', strataId, cohortId),
            ];
		}

    }

    return ComparativeDistributionStatConverter;
});
