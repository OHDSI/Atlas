define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'text!./characterization-results.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'webapi/MomentAPI',
    'less!./characterization-results.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
    'components/charts/scatterplot',
    'components/charts/boxplot',
    'd3-scale-chromatic',
], function (
    ko,
    CharacterizationService,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    numeral,
    lodash,
    d3,
    filterUtils,
    momentAPI,
) {

    class CharacterizationViewEditResults extends Component {

        get distributionColumns() {
            return [
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
        }

        constructor(params) {
            super();

            this.convertPrevalenceAnalysis = this.convertPrevalenceAnalysis.bind(this);
            this.convertScatterplotData = this.convertScatterplotData.bind(this);
            this.prepareTabularData = this.prepareTabularData.bind(this);

            this.loading = ko.observable(false);

            this.data = ko.observable([]);
            this.filterList = ko.observableArray([]);

            this.reportList = ko.computed(() => this.prepareTabularData(this.data().analyses, this.filterList()));

            this.groupedScatterData = ko.computed(() => {
                return this.reportList().filter(analysis => analysis.type === 'prevalence').map(analysis => ({
                    name: analysis.analysisName,
                    values: this.convertScatterplotData(analysis),
                }));
            });

            this.groupedTabularData = ko.computed(() => {
                const reportList = this.getPrevalenceReports(this.reportList());

                if (reportList.length < 1) {
                    return { columns: [], data: [] };
                }

                return {
                    columns: reportList[0].columns,
                    data: lodash.flatten(reportList.map(a => a.data))
                }
            });

            this.groupedScatterColorScheme = d3.schemeCategory10;
            this.scatterXScale = d3.scaleLinear().domain([0, 100]);
            this.scatterYScale = d3.scaleLinear().domain([0, 100]);

            this.loadData();
        }

        formatDate(date) {
            return momentAPI.formatDateTimeUTC(date);
        }

        loadData() {
            this.loading(true);
            CharacterizationService
                .loadCharacterizationResults()
                .then(res => {
                    this.filterList(this.getFilterList(res.analyses));
                    this.data(res);
                    this.loading(false);
                });
        }

        getFilterList(data) {
            const cohorts = lodash.uniqBy(
                lodash.flatten(
                    data.map(a => a.reports.map(r => ({label: r.cohortName, value: r.cohortId})))
                ),
                'value'
            );

            return [
                {
                    type: 'multiselect',
                    label: 'Cohorts',
                    name: 'cohorts',
                    options: ko.observable(cohorts),
                    selectedValues: ko.observable(cohorts.map(c => c.value)),
                },
                {
                    type: 'multiselect',
                    label: 'Analyses',
                    name: 'analyses',
                    options: ko.observable(data.map(a => ({label: a.analysisName, value: a.analysisId}))),
                    selectedValues: ko.observable(data.map(a => a.analysisId)),
                }
            ];
        }

        isComparatativeMode(filterList) {
            const filter = filterList.find(f => f.name === 'cohorts');
            if (!filter) {
                return false;
            }
            return filter.selectedValues().length === 2;
        }

        getPrevalenceReports(reports) {
            return reports.filter(analysis => analysis.type === 'prevalence');
        }

        prepareTabularData(data = [], filters = []) {
            const filteredData = this.filterData(data, filterUtils.getSelectedFilterValues(filters));

            const convertedData = filteredData.map(analysis => {
                let convertedAnalysis;

                if (analysis.type === 'prevalence') {
                    convertedAnalysis = this.convertPrevalenceAnalysis(analysis);
                } else {
                    if (this.isComparatativeMode(filters)) {
                        convertedAnalysis = this.convertDistributionComparativeAnalysis(analysis);
                    } else {
                        convertedAnalysis = {
                            ...analysis,
                            reports: analysis.reports.map(r => ({...r, data: r.stats, columns: this.distributionColumns})),
                        };
                    }
                }
                return convertedAnalysis;
            });

            return convertedData;
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
            return analysis.data.map(rd => ({ xValue: rd.pct[0], yValue: rd.pct[1] }));
        }

        convertBoxplotData(analysis) {

            return analysis.reports.map(r => ({
                Category: r.cohortName,
                min: r.stats[0].min,
                max: r.stats[0].max,
                median: r.stats[0].median,
                LIF: r.stats[0].p10,
                q1: r.stats[0].p25,
                q3: r.stats[0].p75,
                UIF: r.stats[0].p90
            }));
        }

        convertPrevalenceAnalysis(analysis) {
            let columns = [
                {
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-prev-title'),
                },
            ];

            let data = {};

            analysis.reports.forEach((r, i) => {

                columns.push({
                    title: 'Count',
                    render: (s, p, d) => d.sumValue[i],
                });
                columns.push({
                    title: 'Pct',
                    render: (s, p, d) => this.formatPct(d.pct[i]),
                });

                r.stats.forEach(rd => {
                    if (data[rd.covariateName] === undefined) {
                        data[rd.covariateName] = {
                            covariateName: rd.covariateName,
                            sumValue: [],
                            pct: [],
                        };
                    }

                    const cov = data[rd.covariateName];

                    cov.sumValue.push(rd.sumValue);
                    cov.pct.push(rd.pct);
                });
            });

            data = Object.values(data);

            if (analysis.reports.length === 2) {
                columns.push(
                    {
                        title: 'Std diff',
                        render: (s, p, d) => d.stdDiff,
                        className: this.classes('col-prev-std-diff'),
                        type: 'numberAbs'
                    },
                );
                data.forEach(d => d.stdDiff = this.formatStdDiff(this.calcStdDiffForPrevelanceCovs(
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

        convertDistributionComparativeAnalysis(analysis) {
            let columns = [
                {
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-dist-title'),
                },
            ];

            let data = {};

            analysis.reports.forEach((r, i) => {

                columns.push({
                    title: 'Count',
                    render: (s, p, d) => d.count[i],
                });
                columns.push({
                    title: 'Avg',
                    render: (s, p, d) => d.avg[i],
                });
                columns.push({
                    title: 'Std Dev',
                    render: (s, p, d) => d.stdDev[i],
                });
                columns.push({
                    title: 'Median',
                    render: (s, p, d) => d.median[i],
                });

                r.stats.forEach(rd => {
                    if (data[rd.covariateName] === undefined) {
                        data[rd.covariateName] = {
                            covariateName: rd.covariateName,
                            count: [],
                            avg: [],
                            stdDev: [],
                            median: [],
                        };
                    }

                    const cov = data[rd.covariateName];

                    cov.count.push(rd.count);
                    cov.avg.push(rd.avg);
                    cov.stdDev.push(rd.stdDev);
                    cov.median.push(rd.median);
                });
            });

            data = Object.values(data);

            if (analysis.reports.length === 2) {
                columns.push(
                    {
                        title: 'Std diff',
                        render: (s, p, d) => d.stdDiff,
                        className: this.classes('col-dist-std-diff'),
                        type: 'numberAbs'
                    },
                );
                data.forEach(d => d.stdDiff = this.formatStdDiff(this.calcStdDiffForDistCovs(
                    analysis.reports[0].stats[0],
                    analysis.reports[1].stats[0]
                )));
            }

            return {
                ...analysis,
                columns: columns,
                data: data,
            };
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

        formatStdDiff(val) {
            return numeral(val).format('0,0.0000');
        }

        formatPct(val) {
            return numeral(val).format('0.00') + '%';
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
