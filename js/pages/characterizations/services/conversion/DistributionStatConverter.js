define([
  'knockout',
    './BaseDistributionStatConverter',
	'./DistributionStat',
], function (
    ko,
    BaseDistributionStatConverter,
) {

    class DistributionStatConverter extends BaseDistributionStatConverter {

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn(ko.i18n(this.columnKey('count'), 'Count'), 'count', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('avg'), 'Avg'), 'avg', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('stdev'), 'Std Dev'), 'stdDev', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('min'), 'Min'), 'min', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('p10'), 'P10'), 'p10', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('p25'), 'P25'), 'p25', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('median'), 'Median'), 'median', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('p75'), 'P75'), 'p75', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('p90'), 'P90'), 'p90', strataId, cohortId),
                this.getDecimal2Column(ko.i18n(this.columnKey('max'), 'Max'), 'max', strataId, cohortId),
            ];
        }
        
        getDefaultSort(columnsCount, cohortsCount) {
            return [[ this.getDefaultColumns().length + 6, "desc" ]]; // 1 column is name, then report columns. we use Median column
        }
    }

    return DistributionStatConverter;
});
