define([
    'knockout',
    'atlas-state',
    'text!./characterization-results.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'components/visualizations/filter-panel/utils',
    'less!./characterization-results.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    filterUtils,
) {
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

            this.data = [
                {
                    analysisId: 3,
                    domain: 'Condition',
                    analysisName: 'Charlson Index',
                    type: 'distribution',
                    reports: [
                        {
                            cohortId: 1,
                            cohortName: 'First cohort',
                            data: [
                                {
                                    covariateName: 'Charlson index - Romano adaptation',
                                    count: '9434',
                                    avg: '5.06',
                                    stdDev: '5.14',
                                    min: 0,
                                    p10: 0,
                                    p25: 0,
                                    median: 3,
                                    p75: 8,
                                    p90: 13,
                                    max: 31,
                                },
                            ]
                        },
                        {
                            cohortId: 2,
                            cohortName: 'Second cohort',
                            data: [
                                {
                                    covariateName: 'Charlson index - Romano adaptation',
                                    count: '3820',
                                    avg: '5.4',
                                    stdDev: '4.9',
                                    min: 0,
                                    p10: 1,
                                    p25: 4,
                                    median: 6,
                                    p75: 6,
                                    p90: 8,
                                    max: 8,
                                },
                            ]
                        }
                    ]
                },
                {
                    analysisId: 1,
                    domain: 'Demographics',
                    analysisName: 'Age',
                    type: 'prevalence',
                    reports: [
                        {
                            cohortId: 1,
                            cohortName: 'First cohort',
                            data: [
                                {
                                    covariateName: 'age group: 25-29',
                                    count: '189',
                                    pct: '0.80',
                                },
                                {
                                    covariateName: 'age group: 30-34',
                                    count: '230',
                                    pct: '1.00',
                                },
                                {
                                    covariateName: 'age group: 35-39',
                                    count: '386',
                                    pct: '1.70',
                                }
                            ]
                        },
                        {
                            cohortId: 2,
                            cohortName: 'Second cohort',
                            data: [
                                {
                                    covariateName: 'age group: 25-29',
                                    count: '189',
                                    pct: '0.80',
                                },
                                {
                                    covariateName: 'age group: 30-34',
                                    count: '230',
                                    pct: '1.00',
                                },
                                {
                                    covariateName: 'age group: 35-39',
                                    count: '386',
                                    pct: '1.70',
                                }
                            ]
                        }
                    ]
                },
                {
                    analysisId: 2,
                    domain: 'Demographics',
                    analysisName: 'Gender',
                    type: 'prevalence',
                    reports: [
                        {
                            cohortId: 1,
                            cohortName: 'First cohort',
                            data: [
                                {
                                    covariateName: 'Male',
                                    count: 9434,
                                    pct: '39.30',
                                },
                                {
                                    covariateName: 'Female',
                                    count: '14584',
                                    pct: '60.80',
                                },
                            ]
                        },
                        {
                            cohortId: 2,
                            cohortName: 'Second cohort',
                            data: [
                                {
                                    covariateName: 'Male',
                                    count: 1000,
                                    pct: '10.00',
                                },
                                {
                                    covariateName: 'Female',
                                    count: '9000',
                                    pct: '90.00',
                                },
                            ]
                        }
                    ]
                },
            ];

            this.filterList = [
                {
                    type: 'multiselect',
                    label: 'Cohorts',
                    name: 'cohorts',
                    options: ko.observableArray([
                        {
                            label: 'First cohort',
                            value: 1,
                        },
                        {
                            label: 'Second cohort',
                            value: 2,
                        },
                    ]),
                    selectedValues: ko.observableArray([1,2]),
                },
                {
                    type: 'multiselect',
                    label: 'Analyses',
                    name: 'analyses',
                    options: ko.observableArray([
                        {
                            label: 'Condition / Charlson Index',
                            value: 3,
                        },
                        {
                            label: 'Demographics / Age',
                            value: 1,
                        },
                        {
                            label: 'Demographics / Gender',
                            value: 2,
                        },
                    ]),
                    selectedValues: ko.observableArray([1,2,3]),
                }
            ];

            this.reportList = ko.computed(() => {
                const convertedData = this.data.map(analysis => {
                    return {
                        ...analysis,
                        reports: analysis.reports.map(r => ({...r, columns: analysis.type === 'prevalence' ? prevalenceColumns : distributionColumns})),
                    };
                });
                return this.filterData(convertedData, filterUtils.getSelectedFilterValues(this.filterList));
            });

            this.displayMode = ko.observable('table');
            this.showAsTable = this.showAsTable.bind(this);
            this.showAsChart = this.showAsChart.bind(this);
        }

        filterData(data, { cohorts, analyses }) {
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

        createLineChartData(data) {
            return data.map((entry, idx) => ({
                id: idx,
                xValue: idx,
                // xValue: entry.covariateName,
                yValue: entry.count,
            }));
        }

        showAsTable() {
            this.displayMode('table');
        }

        showAsChart() {
            this.displayMode('chart');
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
