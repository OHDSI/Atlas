define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'text!./characterization-results.html',
    'appConfig',
    'services/AuthService',
    'providers/Component',
    'providers/AutoBind',
    'utils/CommonUtils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'utils/MomentUtils',
    'services/SourceService',
    'less!./characterization-results.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
    'components/charts/scatterplot',
    'components/charts/splitBoxplot',
    'd3-scale-chromatic',
], function (
    ko,
    CharacterizationService,
    view,
    config,
    AuthService,
    Component,
    AutoBind,
    commonUtils,
    numeral,
    lodash,
    d3,
    filterUtils,
    momentAPI,
    SourceService
) {

    class CharacterizationViewEditResults extends AutoBind(Component) {

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

        get covNameColumn() {
            return {
                title: 'Covariate',
                data: 'covariateName',
                className: this.classes('col-prev-title'),
            };
        }

        constructor(params) {
            super();

            this.loading = ko.observable(false);
            this.characterizationId = params.characterizationId;

            this.design = ko.observable({});
            this.executionId = params.executionId;
            this.data = ko.observable([]);
            this.filterList = ko.observableArray([]);

            this.analysisList = ko.computed(() => this.prepareTabularData(this.data().analyses, this.filterList()));

            this.groupedScatterColorScheme = d3.schemeCategory10;
            this.scatterXScale = d3.scaleLinear().domain([0, 100]);
            this.scatterYScale = d3.scaleLinear().domain([0, 100]);

            this.executionId.subscribe(id => id && this.loadData());
            this.loadData();
        }

        formatDate(date) {
            return momentAPI.formatDateTimeUTC(date);
        }

        getCountColumn(idx) {
            return {
                title: 'Count',
                render: (s, p, d) => d.sumValue[idx],
            };
        }

        getPctColumn(idx) {
            return {
                title: 'Pct',
                render: (s, p, d) => this.formatPct(d.pct[idx]),
            };
        }

        loadData() {
            this.loading(true);

            Promise.all([
                SourceService.find(),
                CharacterizationService.loadCharacterizationExportDesignByGeneration(this.executionId()),
                CharacterizationService.loadCharacterizationExecution(this.executionId()),
                CharacterizationService.loadCharacterizationResults(this.executionId())
            ]).then(([
                 sourceList,
                 design,
                 execution,
                 resultsList
            ]) => {

                this.design(design);

                const source = sourceList.find(s => s.sourceKey === execution.sourceKey);

                const result = {
                    sourceId: source.sourceId,
                    sourceName: source.sourceName,
                    date: execution.endTime,
                    designHash: execution.hashCode,
                    analyses: lodash.uniqBy(
                        resultsList.map(r => ({
                            analysisId: r.analysisId,
                            // TODO
                            domainId: null, // "Demographics",
                            analysisName: r.analysisName,
                            type: r.resultType.toLowerCase(),
                        })),
                        'analysisId'
                    )
                };

                resultsList.forEach(r => {

                    const analysis = result.analyses.find(a => a.analysisId === r.analysisId);
                    if (!analysis.reports) {
                        analysis.reports = []
                    };
                    let report = analysis.reports.find(report => report.cohortId === r.cohortId);
                    if (!report) {
                        report = {
                            cohortId: r.cohortId,
                            cohortName: this.design().cohorts.find(c => c.id === r.cohortId).name,
                            stats: []
                        };
                        analysis.reports.push(report);
                    }
                    report.stats.push({
                        covariateId: r.covariateId,
                        covariateName: r.covariateName,
                        conceptId: r.conceptId,
                        avg: r.avg,
                        ...(r.resultType.toLowerCase() === 'prevalence' ? {sumValue: r.count} : {count: r.count }),
                        pct: r.avg * 100,
                        min: r.min,
                        p10: r.p10,
                        p25: r.p25,
                        median: r.median,
                        p75: r.p75,
                        p90: r.p90,
                        max: r.max,
                        stdDev: r.stdDev
                    });
                });

                this.filterList(this.getFilterList(result.analyses));
                this.data(result);
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

        getCovariatesSummaryAnalysis(analyses) {
            if (analyses.length > 1 && analyses[0].reports.length === 2) {

                const getAllCohortStats = (cohortId) => {
                    return lodash.flatten(analyses.map(a => {
                        const analysisName = a.analysisName;
                        const stats = lodash.flatten(a.reports.filter(r => r.cohortId === cohortId).map(r => r.stats));
                        return stats.map(s => ({ ...s, analysisName }));
                    }));
                };

                const firstCohort = analyses[0].reports[0];
                const secondCohort = analyses[0].reports[1];

                return {
                    analysisName: 'All covariates',
                    type: 'prevalence',
                    reports: [
                        { ...firstCohort, stats: getAllCohortStats(firstCohort.cohortId) },
                        { ...secondCohort, stats: getAllCohortStats(secondCohort.cohortId) }
                    ]
                };
            }
        }

        prepareTabularData(data = [], filters = []) {
            const filteredData = this.filterData(data, filterUtils.getSelectedFilterValues(filters));

            const summaryAnalysis = this.getCovariatesSummaryAnalysis(filteredData, filters);
            if (summaryAnalysis) {
                filteredData.unshift(summaryAnalysis);
            }

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
                            reports: analysis.reports.map(r => ({
                                ...r,
                                data: r.stats,
                                columns: this.distributionColumns
                            })),
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

        tooltipBuilder(d) {
            return `
                <div>Series: ${d.seriesName}</div>
                <div>Covariate: ${d.covariateName}</div>
                <div>X: ${d.xValue}</div>
                <div>Y: ${d.yValue}</div>
            `;
        }

        convertScatterplotData(analysis) {
            const seriesData = lodash.groupBy(analysis.data, 'analysisName');
            return Object.keys(seriesData).map(key => ({
                name: key,
                values: seriesData[key].filter(rd => rd.pct[0] && rd.pct[1]).map(rd => ({
                    covariateName: rd.covariateName,
                    xValue: rd.pct[0] || 0,
                    yValue: rd.pct[1] || 0
                })),
            }));
        }

        convertBoxplotData(analysis) {

            const getBoxplotStruct = r => ({
                Category: r.cohortName,
                min: r.stats[0].min,
                max: r.stats[0].max,
                median: r.stats[0].median,
                LIF: r.stats[0].p10,
                q1: r.stats[0].p25,
                q3: r.stats[0].p75,
                UIF: r.stats[0].p90
            });

            return [{
                target: getBoxplotStruct(analysis.reports[0]),
                compare: getBoxplotStruct(analysis.reports[1]),
            }]
        }

        convertPrevalenceAnalysis(analysis) {
            let columns = [ this.covNameColumn ];

            let data = {};

            analysis.reports.forEach((r, i) => {

                columns.push(this.getCountColumn(i));
                columns.push(this.getPctColumn(i));

                r.stats.forEach(rd => {
                    if (data[rd.covariateName] === undefined) {
                        data[rd.covariateName] = {
                            analysisName: rd.analysisName || analysis.analysisName,
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
