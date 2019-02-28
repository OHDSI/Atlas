define([
    './BaseStatConverter',
	'./DistributionStat',
], function (
    BaseStatConverter,
	DistributionStat,
) {

    class BaseDistributionStatConverter extends BaseStatConverter {

        constructor(classes) {
            super(classes);
        }

        getRowId(stat) {
            // Transform stratas into rows
            return stat.strataId;
        }

        getResultObject(stat) {
            return new DistributionStat(stat);
        }

        extractStrata(stat) {
            // Transform stratas into rows
            return { strataId: 0, strataName: '' };
        }

        getDefaultColumns(analysis) {
            return [{
              title: 'Strata',
              data: 'strataName',
              className: this.classes('col-distr-title'),
            }];
        }

        calcStdDiff(reports, stat) {
            const firstCohortId = reports[0].cohortId;
            const secondCohortId = reports[1].cohortId;

            return this.calcStdDiffForDistCovs(
                { sumValue: stat.count[0][firstCohortId], pct: stat.pct[0][firstCohortId], avg: stat.avg[0][firstCohortId], stdDev: stat.stdDev[0][firstCohortId] },
                { sumValue: stat.count[0][secondCohortId], pct: stat.pct[0][secondCohortId], avg: stat.avg[0][secondCohortId], stdDev: stat.stdDev[0][secondCohortId] }
            );
		}

		calcStdDiffForDistCovs(cov1, cov2) {
            const n1 = cov1.sumValue / (cov1.pct / 100);
            const n2 = cov2.sumValue / (cov2.pct / 100);

            const mean1 = cov1.avg;
            const mean2 = cov2.avg;

            const sd1 = cov1.stdDev;
            const sd2 = cov2.stdDev;

            const sd = Math.sqrt(sd1 * sd1 + sd2 * sd2);

            return (mean2 - mean1) / sd;
        }

        convertFields(result, strataId, cohortId, stat) {
            result.strataName = stat.strataName;
            ['count', 'avg', 'pct', 'stdDev', 'median', 'max', 'min', 'p10', 'p25', 'p75', 'p90'].forEach(field => {
			    this.setNestedValue(result, field, strataId, cohortId, stat[field]);
            });
        }
    }

    return BaseDistributionStatConverter;
});
