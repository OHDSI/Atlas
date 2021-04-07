define([
  'knockout',
    './BaseStatConverter',
	'./DistributionStat',
], function (
    ko,
    BaseStatConverter,
	DistributionStat,
) {

    class BaseDistributionStatConverter extends BaseStatConverter {

        constructor(classes) {
            super(classes);
        }

        convertAnalysisToTabularData(analysis, stratas = null) {

            const result = super.convertAnalysisToTabularData(analysis, stratas);
            stratas && stratas.filter(s => result.data.findIndex(row => row.strataId === s.strataId) < 0)
              .forEach(s => result.data.push(this.getResultObject(
                {
                  analysisId: analysis.analysisId,
                  analysisName: analysis.analysisName,
                  domainId: analysis.domainId,
                  cohorts: [],
                  strataId: s.strataId,
                  strataName: s.strataName,
                }
              )));
            return result;
        }

        getRowId(stat) {
            // Transform stratas into rows
            return stat.strataId * 100000 + stat.covariateId;
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
              title: ko.i18n('columns.strata', 'Strata'),
              data: 'strataName',
              className: this.classes('col-distr-title'),
              // visible: false,
							xssSafe:false,
            },
            {
              title: 'Covariate',
              data: 'covariateName',
              className: this.classes('col-distr-cov'),
              xssSafe: false,
            },
            {
              title: 'Value field',
              data: (row, type) => {
                  let data = (row.faType === 'CRITERIA_SET' && row.aggregateName) || "Events count" ;
                  if (row.missingMeansZero) {
                      data = data + "*"; // mark missingMeansZero elements with a * in table
                  }
                  return data;
              }
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

        convertFields(result, strataId, cohortId, stat, prefix) {
            result.strataName = stat.strataName;
            ['count', 'avg', 'pct', 'stdDev', 'median', 'max', 'min', 'p10', 'p25', 'p75', 'p90'].forEach(field => {
                const statName = prefix ? prefix + field.charAt(0).toUpperCase() + field.slice(1) : field;
			    this.setNestedValue(result, field, strataId, cohortId, stat[statName]);
            });
        }

        convertCompareFields(result, strataId, stat) {
            this.convertFields(result, strataId, stat.targetCohortId, stat, "target");
            this.convertFields(result, strataId, stat.comparatorCohortId, stat, "comparator");
		}
    }

    return BaseDistributionStatConverter;
});
