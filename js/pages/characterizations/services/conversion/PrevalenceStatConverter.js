define([
  'knockout',
    './BaseStatConverter',
	'./PrevalenceStat',
	'../../utils',
	'utils/CommonUtils'
], function (
  ko,
    BaseStatConverter,
	PrevalenceStat,
	utils,
	commonUtils
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

        convertFields(result, strataId, cohortId, stat, prefix) {
            ['count', 'pct'].forEach(field => {
                const statName = prefix ? prefix + field.charAt(0).toUpperCase() + field.slice(1) : field;
			    this.setNestedValue(result, field, strataId, cohortId, stat[statName]);
            });
		}

        convertCompareFields(result, strataId, stat) {
            this.convertFields(result, strataId, stat.targetCohortId, stat, "target");
            this.convertFields(result, strataId, stat.comparatorCohortId, stat, "comparator");
		}

        getDefaultColumns(analysis) {
            return [
                this.getCovNameColumn(analysis),
                this.getExploreColumn(),
                {
                    title: ko.i18n('columns.conceptId', 'Concept ID'),
                    data: 'conceptId',
                    render: (d, t, r) => {
                        if (r.conceptId === null || r.conceptId === undefined) {
                            return 'N/A';
                        } else {
                            return `<a href="#/concept/${r.conceptId}" data-bind="tooltip: '${r.conceptName ? commonUtils.escapeTooltip(r.conceptName) : null}'">${r.conceptId}</a>`
                        }
                    }
                }
            ];
        }

		getReportColumns(strataId, cohortId) {
            return [
                this.getCountColumn(ko.i18n('columns.count', 'Count'), 'count', strataId, cohortId),
                this.getPctColumn(ko.i18n('columns.pct', 'Pct'), 'pct', strataId, cohortId)
            ];
		}

        getCovNameColumn(analysis) {
            let covNameColumn = {
                title: ko.i18n('columns.covariate', 'Covariate'),
                data: 'covariateName',
                className: this.classes('col-prev-title'),
                render: (d, t, { covariateName, faType }) => utils.extractMeaningfulCovName(covariateName, faType),
                xssSafe:false,
            };
            if (analysis && analysis.rawAnalysisName === 'DemographicsAgeGroup') {
                covNameColumn.type = 'range';
            }
            return covNameColumn;
        }

        getExploreColumn() {
            return {
                title: ko.i18n('columns.explore', 'Explore'),
                data: 'explore',
                className: this.classes('col-explore'),
                render: (d, t, r) => {
                    const stat = r;
                    let html;
                    if (stat && stat.analysisId && (stat.domainId !== undefined && stat.domainId !== 'DEMOGRAPHICS')) {
                        if (stat.cohorts.length > 1) {
                            html = `<div class='${this.classes('explore-dropdown')}'>`;
                            html += `<a href='#' class='dropdown-toggle' data-toggle='dropdown' role='button' aria-expanded='false'><span data-bind="text: ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.explore', 'Explore')"></span><span class='${this.classes({ element: 'explore-caret', extra: 'caret'})}'></span></a>`;
                            html += "<ul class='dropdown-menu' role='menu'>";
                            stat.cohorts.forEach((cohort, idx) => {
                                html += `<li class='${this.classes('explore-menu-item')}' title='${cohort.cohortName}'>
                                    <a class='${this.classes('explore-menu-item-link')}' data-bind="click: () => $component.exploreByFeature($data, '${idx}')">${cohort.cohortName}</a>
                                </li>`;
                            });
                            html += "</ul></div>";
                        } else {
                            html = name + `<div><a class='${this.classes('explore-link')}' data-bind="click: () => $component.exploreByFeature($data, 0), text: ko.i18n('cc.viewEdit.executions.prevalenceStatConverter.explore', 'Explore')"></a></div>`;
                        }
                    } else {
                        html = "N/A";
                    }
                    return html;
                },
                xssSafe:false,
            };
        }
    }

    return PrevalenceStatConverter;
});
