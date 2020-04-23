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
                this.getCountColumn(ko.i18n('cc.viewEdit.results.table.columns.count', 'Count'), 'count', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.avg', 'Avg'), 'avg', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.stdev', 'Std Dev'), 'stdDev', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.min', 'Min'), 'min', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.p10', 'P10'), 'p10', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.p25', 'P25'), 'p25', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.median', 'Median'), 'median', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.p75', 'P75'), 'p75', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.p90', 'P90'), 'p90', strataId, cohortId),
                this.getDecimal2Column(ko.i18n('cc.viewEdit.results.table.columns.max', 'Max'), 'max', strataId, cohortId),
            ];
        }
        
        getDefaultSort(columnsCount, cohortsCount) {
            return [[ this.getDefaultColumns().length + 6, "desc" ]]; // 1 column is name, then report columns. we use Median column
        }
    }

    return DistributionStatConverter;
});
