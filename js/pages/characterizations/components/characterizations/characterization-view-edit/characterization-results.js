define([
    'knockout',
    'atlas-state',
    'text!./characterization-results.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'numeral',
    'lodash',
    'components/visualizations/filter-panel/utils',
    'text!pages/characterizations/stubs/characterization-results-data.json',
    'less!./characterization-results.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
    'components/charts/scatterplot',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    numeral,
    lodash,
    filterUtils,
    characterizationResultsDataStub,
) {
    const AGG_MODES = {
        COMPARE: 1,
        SUM: 2,
    };

    class CharacterizationViewEditResults extends Component {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            const prevalenceColumns = [
                {
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-prev-title'),
                },
                {
                    title: 'Count',
                    data: 'count',
                    className: this.classes('col-prev-count'),
                },
                {
                    title: '% of cohort',
                    data: 'pct',
                    className: this.classes('col-prev-pct'),
                },
            ];

            const distributionColumns = [
                {
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-distr-title'),
                },
                {
                    title: 'Count',
                    data: 'count',
                    className: this.classes('col-distr-count'),
                },
                {
                    title: 'Avg',
                    data: 'avg',
                    className: this.classes('col-dist-avg'),
                },
                {
                    title: 'Std Dev',
                    data: 'stdDev',
                    className: this.classes('col-dist-std-dev'),
                },
                {
                    title: 'Min',
                    data: 'min',
                    className: this.classes('col-dist-min'),
                },
                {
                    title: 'P10',
                    data: 'p10',
                    className: this.classes('col-dist-p10'),
                },
                {
                    title: 'P25',
                    data: 'p25',
                    className: this.classes('col-dist-p25'),
                },
                {
                    title: 'Median',
                    data: 'median',
                    className: this.classes('col-dist-median'),
                },
                {
                    title: 'P75',
                    data: 'p75',
                    className: this.classes('col-dist-p75'),
                },
                {
                    title: 'P90',
                    data: 'p90',
                    className: this.classes('col-dist-p90'),
                },
                {
                    title: 'Max',
                    data: 'max',
                    className: this.classes('col-dist-max'),
                },
            ];

            this.dataSource = {
                id: 1,
                name: 'SynPUF 110k (CDM v5.3)',
            };

            this.data = JSON.parse(characterizationResultsDataStub).analyses;

            this.displayedAnalyses = ko.observableArray([1, 2, 3]);

            this.cohorts = lodash.uniqBy(
                lodash.flatten(
                    this.data.map(a => a.reports.map(r => ({label: r.cohortName, value: r.cohortId})))
                ),
                'value'
            );
            this.analyses = this.data.map(a => ({label: a.analysisName, value: a.analysisId}));

            this.filterList = [
                {
                    type: 'multiselect',
                    label: 'Cohorts',
                    name: 'cohorts',
                    options: ko.observableArray(this.cohorts),
                    selectedValues: ko.observableArray(this.cohorts.map(c => c.value)),
                },
                {
                    type: 'multiselect',
                    label: 'Analyses',
                    name: 'analyses',
                    options: ko.observableArray(this.analyses),
                    selectedValues: ko.observableArray(this.analyses.map(c => c.value)),
                }
            ];

            this.displayMode = ko.observable('table');

            this.AGG_MODES = AGG_MODES;
            this.selectedAggMode = ko.observable(this.AGG_MODES.COMPARE);

            this.reportList = ko.computed(() => {
                const filteredData = this.filterData(this.data, filterUtils.getSelectedFilterValues(this.filterList));

                const convertedData = filteredData.map(analysis => {
                    let convertedAnalysis;

                    if (analysis.type === 'prevalence') {
                        convertedAnalysis = this.convertPrevalenceAnalysis(analysis, this.selectedAggMode());
                    } else {
                        convertedAnalysis = {
                            ...analysis,
                            reports: analysis.reports.map(r => ({...r, data: r.stats, columns: distributionColumns})),
                        };
                    }
                    return convertedAnalysis;
                });

                return convertedData;
            });

            this.convertPrevalenceAnalysis = this.convertPrevalenceAnalysis.bind(this);
            this.showAsTable = this.showAsTable.bind(this);
            this.showAsChart = this.showAsChart.bind(this);
            this.showAsComparison = this.showAsComparison.bind(this);
            this.showAsSum = this.showAsSum.bind(this);
            this.convertScatterplotData = this.convertScatterplotData.bind(this);
        }

        filterData(data, {cohorts, analyses}) {
            return data.map(analysis => {
                if (!analyses.includes(analysis.analysisId)) {
                    return null;
                }
                return {
                    ...analysis,
                    reports: analysis.reports.map(r => (cohorts.includes(r.cohortId) ? r : null)).filter(r => r),
                };
            }).filter(a => a);
        }

        convertScatterplotData(analysis) {
            return ko.computed(() => {
                return analysis.data.map(rd => ({ xValue: rd.sumValue[0], yValue: rd.sumValue[1] }));
            });
        }

        convertPrevalenceAnalysis(analysis, aggMode) {
            let columns = [
                {
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-prev-title'),
                },
            ];

            let data = {};

            let colDef;
            let aggFunc;

            if (aggMode === AGG_MODES.COMPARE) {

                colDef = (columns, i) => {
                    columns.push({
                        title: 'Count',
                        render: (s, p, d) => d.sumValue[i],
                    });
                    columns.push({
                        title: 'Pct',
                        render: (s, p, d) => this.formatPct(d.pct[i]),
                    });
                }

                aggFunc = (obj, field, value) => {
                    if (typeof obj[field] === 'undefined') {
                        obj[field] = [];
                    }
                    obj[field].push(value);
                }
            }

            analysis.reports.forEach((r, i) => {

                colDef(columns, i);

                r.stats.forEach(rd => {
                    if (data[rd.covariateName] === undefined) {
                        data[rd.covariateName] = {
                            covariateName: rd.covariateName,
                        };
                    }

                    const cov = data[rd.covariateName];

                    aggFunc(cov, 'sumValue', rd.sumValue);
                    aggFunc(cov, 'pct', rd.pct);
                });
            });

            data = Object.values(data);

            if (analysis.reports.length === 2) {
                columns.push(
                    {
                        title: 'Std diff',
                        render: (s, p, d) => d.stdDiff,
                        className: this.classes('col-prev-std-diff'),
                    },
                );
                data.forEach(d => d.stdDiff = this.formatStdDiff(this.calcStdDiff(
                    {sumValue: d.sumValue[0], pct: d.pct[0]},
                    {sumValue: d.sumValue[1], pct: d.pct[1]}
                )));
            }

            return {
                ...analysis,
                columns: columns,
                data: data,
            };
        }

        calcStdDiff(cov1, cov2) {
            const n1 = cov1.sumValue / (cov1.pct / 100);
            const n2 = cov2.sumValue / (cov2.pct / 100);

            const mean1 = cov1.sumValue / n1;
            const mean2 = cov2.sumValue / n2;

            const sd1 = Math.sqrt((n1 * cov1.sumValue + cov1.sumValue) / (n1 * n1));
            const sd2 = Math.sqrt((n2 * cov2.sumValue + cov2.sumValue) / (n2 * n2));

            const sd = Math.sqrt(sd1 * sd1 + sd2 * sd2);

            return (mean2 - mean1) / sd;
        }

        formatStdDiff(val) {
            return numeral(val).format('0,0.0000');
        }

        formatPct(val) {
            return numeral(val).format('0.00') + '%';
        }

        showAsTable() {
            this.displayMode('table');
        }

        showAsChart() {
            this.displayMode('chart');
        }

        showAsComparison() {
            this.selectedAggMode(this.AGG_MODES.COMPARE);
        }

        showAsSum() {
            this.selectedAggMode(this.AGG_MODES.SUM);
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
