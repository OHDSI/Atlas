define([
    './BaseStatConverter',
	'./PrevalenceStat',
], function (
    BaseStatConverter,
	PrevalenceStat
) {

    class PrevalenceStatConverter extends BaseStatConverter {

        getResultObject(stat) {
        	return new PrevalenceStat(stat);
        }

        getRowId(stat) {
            return stat.covariateId;
        }

        extractStrata(stat) {
            return { strataId: stat.strataId, strataName: stat.strataName};
        }

        convertFields(result, strataId, cohortId, stat) {
            ['count', 'pct'].forEach(field => {
			    this.setNestedValue(result, field, strataId, cohortId, stat[field]);
            });
		}

		getDefaultColumns(analysis) {
		    return [ this.getСovNameColumn() ];
		}

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn('Count', 'count', strataId, cohortId),
                this.getPctColumn('Pct', 'pct', strataId, cohortId)
            ];
		}

        getСovNameColumn() {
            return {
                title: 'Covariate',
                data: 'covariateName',
                className: this.classes('col-prev-title'),
                render: (d, t, r) => {
                    const stat = r;
                    let html;
                    if (stat && stat.analysisId && stat.domainId !== 'DEMOGRAPHICS') {
                        if (stat.cohorts.length > 1) {
                          html = d + `<div class='${this.classes({element: 'explore'})}'>Explore ` + stat.cohorts.map((c, idx) => {
                            return `<a class='${this.classes({element: 'explore-link'})}' data-bind='click: () => $component.exploreByFeature($data, ${idx})'>${c.cohortName}</a>`;
                          }).join('&nbsp;&bull;&nbsp;') + '</div>';
                        } else {
                            html = d + `<div><a class='${this.classes('explore-link')}' data-bind='click: () => $component.exploreByFeature($data, 0)'>Explore</a></div>`;
                        }
                    } else {
                        html = d;
                    }
                    return html;
                 },
            };
        }

        calcStdDiff(cohorts, stat) {
            const firstCohortId = cohorts[0].cohortId;
            const secondCohortId = cohorts[1].cohortId;

            if (!stat.count[0] || !stat.pct[0]) {
                return null;
            }

            return this.calcStdDiffForPrevelanceCovs(
                { sumValue: stat.count[0][firstCohortId], pct: stat.pct[0][firstCohortId] },
                { sumValue: stat.count[0][secondCohortId], pct: stat.pct[0][secondCohortId] }
            );
		}

        calcStdDiffForPrevelanceCovs(cov1, cov2) {
            const n1 = cov1.sumValue / (cov1.pct / 100);
            const n2 = cov2.sumValue / (cov2.pct / 100);

            const mean1 = cov1.sumValue / n1;
            const mean2 = cov2.sumValue / n2;

            const sd1 = Math.sqrt((n1 * cov1.sumValue + cov1.sumValue) / (n1 * n1));
            const sd2 = Math.sqrt((n2 * cov2.sumValue + cov2.sumValue) / (n2 * n2));

            const sd = Math.sqrt(sd1 * sd1 + sd2 * sd2);

            return (mean2 - mean1) / sd;
        }
    }

    return PrevalenceStatConverter;
});
