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
                this.getCountColumn(ko.i18n('columns.personsCount', 'Persons'), 'count', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.avg', 'Avg'), 'avg', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.stddev', 'Std Dev'), 'stdDev', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.min', 'Min'), 'min', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.p10', 'P10'), 'p10', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.p25', 'P25'), 'p25', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.median', 'Median'), 'median', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.p75', 'P75'), 'p75', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.p90', 'P90'), 'p90', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('columns.max', 'Max'), 'max', strataId, cohortId),
            ];
        }
        
        getDefaultSort(columnsCount, cohortsCount) {
            return [[ this.getDefaultColumns().length + 6, "desc" ]]; // 1 column is name, then report columns. we use Median column
        }
    }

    return DistributionStatConverter;
});
