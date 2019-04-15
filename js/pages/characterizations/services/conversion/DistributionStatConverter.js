define([
    './BaseDistributionStatConverter',
	'./DistributionStat',
], function (
    BaseDistributionStatConverter,
) {

    class DistributionStatConverter extends BaseDistributionStatConverter {

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn('Count', 'count', strataId, cohortId),
                this.getDecimal2Column('Avg', 'avg', strataId, cohortId),
                this.getDecimal2Column('Std Dev', 'stdDev', strataId, cohortId),
                this.getDecimal2Column('Min', 'min', strataId, cohortId),
                this.getDecimal2Column('P10', 'p10', strataId, cohortId),
                this.getDecimal2Column('P25', 'p25', strataId, cohortId),
                this.getDecimal2Column('Median', 'median', strataId, cohortId),
                this.getDecimal2Column('P75', 'p75', strataId, cohortId),
                this.getDecimal2Column('P90', 'p90', strataId, cohortId),
                this.getDecimal2Column('Max', 'max', strataId, cohortId),
            ];
        }
        
        getDefaultSort(columnsCount, cohortsCount) {
            return [[ this.getDefaultColumns().length + 6, "desc" ]]; // 1 column is name, then report columns. we use Median column
        }
    }

    return DistributionStatConverter;
});
