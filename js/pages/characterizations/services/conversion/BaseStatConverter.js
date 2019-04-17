define([
    'numeral',
    '../../utils',
], function (
	numeral,
  utils,
) {

    class BaseStatConverter {

        constructor(classes) {
            this.classes = classes;
        }

		convertAnalysisToTabularData(analysis) {
            let columns = this.getDefaultColumns(analysis);

            const data = new Map();
            const cohorts = analysis.reports.map(report => ({ cohortId: report.cohortId, cohortName: report.cohortName }));
            const strataNames = new Map();

            const mapCovariate = (report) => (stat) => {
                let row;
                const rowId = this.getRowId(stat);

                if (!data.has(rowId)) {
                    row = this.getResultObject({
                        analysisId: analysis.analysisId,
                        analysisName: analysis.analysisName,
                        domainId: analysis.domainId,
                        ...stat
                    });
                    data.set(rowId, row);
                } else {
                    row = data.get(rowId);
                }

                // Required for displaying "Explore" link properly
                if (row.cohorts.filter(c => c.cohortId === report.cohortId).length === 0) {
                  row.cohorts.push({cohortId: report.cohortId, cohortName: report.cohortName});
                }

                const { strataId, strataName } = this.extractStrata(stat);

                this.convertFields(row, strataId, report.cohortId, stat);

                if (!strataNames.has(strataId)) {
                    strataNames.set(strataId, strataName);
                }
            };

            analysis.reports.forEach((r, i) => r.stats.forEach(mapCovariate(r)));

            cohorts.forEach((c, i) => {
              for (let strataId of utils.sortedStrataNames(strataNames).map(s => s.id)) {
                columns = columns.concat(this.getReportColumns(strataId, c.cohortId));
              }
            });

            const strataOnly = !strataNames.has(0) && data.size > 0;
            const stratified = !(strataNames.has(0) && strataNames.size === 1) && data.size > 0;

            if (!strataOnly && cohorts.length === 2) {
                columns.push(this.getStdDiffColumn());
                data.forEach(d => d.stdDiff = this.formatStdDiff(this.calcStdDiff(cohorts, d)));
            }

            return {
                type: analysis.type,
                domainId: analysis.domainId,
                analysisName: analysis.analysisName,
                strataOnly,
                stratified,
                cohorts,
                strataNames: strataNames,
                defaultColNames: this.getDefaultColumns().map(col => col.title),
                perStrataColNames: this.getReportColumns(0,0).map(col => col.title),
                columns: columns,
                defaultSort: this.getDefaultSort(columns.length, cohorts.length),
                data: Array.from(data.values()),
            };
        }

        getDefaultSort(columnsCount, cohortsCount) {
            return [[ columnsCount - 1, "desc" ]]; // this is either for Std Diff (in comparison mode) or Pct (in single cohort mode)
        }

        getRowId(stat) {
            throw "Override getRowId with actual implementation";
        }

        extractStrata(stat) {
            throw "Override extractStrata with actual implementation";
        }

        setNestedValue(result, field, strataId, cohortId, value) {
        	if (result[field][strataId] === undefined) {
				result[field][strataId] = {};
			}
			result[field][strataId][cohortId] = value;
        }

        getStdDiffColumn() {
            return {
              title: 'Std diff',
              render: (s, p, d) => d.stdDiff,
              className: this.classes('col-dist-std-diff'),
              type: 'numberAbs'
            };
        }

	    formatStdDiff(val) {
            return numeral(val).format('0,0.0000');
		}

	    formatPct(val) {
            return numeral(val).format('0.00') + '%';
		}

        getColumn(label, field, strata, cohortId, formatter) {
            return {
                title: label,
                render: (s, p, d) => {
                    let res = d[field][strata] && d[field][strata][cohortId] || 0;
                    if (formatter) {
                        res = formatter(res);
                    }
                    return res;
				}
            };
        }

        getCountColumn(label, field, strata, cohortId) {
            return this.getColumn(label, field, strata, cohortId, v => numeral(v).format());
        }

        getDecimal2Column(label, field, strata, cohortId) {
            return this.getColumn(label, field, strata, cohortId, v => numeral(v).format('0.00'));
        }

        getPctColumn(label, field, strata, cohortId) {
            return this.getColumn(label, field, strata, cohortId, this.formatPct);
        }
    }

    return BaseStatConverter;
});
