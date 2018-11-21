define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'text!./characterization-results.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'services/MomentAPI',
    'services/Source',
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
    authApi,
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
            this.stratifiedByTitle = ko.pureComputed(() => this.design().stratifiedBy || '');

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
                render: (s, p, d) => numeral(d.sumValue[idx]).format(),
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
                SourceService.loadSourceList(),
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
                        const cohort = this.design().cohorts.find(c => c.id === r.cohortId);
                        report = {
                            cohortId: r.cohortId,
                            cohortName: cohort ? cohort.name : '',
                            stats: [],
                            stratas: []
                        };
                        analysis.reports.push(report);
                    }
                    const stat = {
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
                    };
                    if (r.strataId > 0) {
                      report.stratas.push({...stat, strataId: r.strataId, strataName: r.strataName});
                    } else {
                      report.stats.push(stat);
                    }
                });

                result.analyses.forEach(a => a.reports.sort((a,b) => a.cohortName.localeCompare(b.cohortName)));

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
                    return lodash.flatten(analyses.filter(a => a.type=="prevalence").map(a => {
                        const analysisName = a.analysisName;
                        const stats = lodash.flatten(a.reports.filter(r => r.cohortId === cohortId).map(r => r.stats));
                        return stats.map(s => ({ ...s, analysisName }));
                    }));
                };

                const firstCohort = analyses[0].reports[0];
                const secondCohort = analyses[0].reports[1];

                return {
                    analysisName: 'All prevalence covariates',
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
                        convertedAnalysis = this.convertDistributionAnalysis(analysis);
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

            let stratas = {};

            let strataColumns = [ this.covNameColumn ];

            let strataNames = [];

            function PrevalenceStat(rd = {}) {
                this.analysisName = rd.analysisName || analysis.analysisName;
                this.covariateName = rd.covariateName;
                this.domainId = rd.domainId;
                this.cohortId = rd.cohortId;
                this.cohortName = rd.cohortName;
                this.sumValue = [];
                this.pct = [];
            }

            const mapCovariate = (data) => (rd) => {
                if (data[rd.covariateName] === undefined) {
                    data[rd.covariateName] = new PrevalenceStat(rd);
                }

                const cov = data[rd.covariateName];

                cov.sumValue.push(rd.sumValue);
                cov.pct.push(rd.pct);
            };

            const mapStrata = (rd) => {
              if (stratas[rd.cohortId] === undefined) {
                  const {analysisName, domainId, cohortId, cohortName } = new PrevalenceStat(rd);
                  stratas[rd.cohortId] = {
                    analysisName, domainId, cohortId, cohortName, data: {},
                  };
              }
              const data = stratas[rd.cohortId].data;
              if (data[rd.covariateName] === undefined) {
                  const { covariateName } = new PrevalenceStat(rd);
                  data[rd.covariateName] = { covariateName, sumValue: {}, pct: {} };
              }
              const cov = data[rd.covariateName];

              cov.sumValue[rd.strataId] = rd.sumValue;
              cov.pct[rd.strataId] = rd.pct;
            };

            analysis.reports.forEach((r, i) => {

                columns.push(this.getCountColumn(i));
                columns.push(this.getPctColumn(i));

                r.stats.forEach(mapCovariate(data));
                r.stratas.forEach(st => mapStrata({...st, cohortId: r.cohortId, cohortName: r.cohortName }));

                if (i < 1) {
                    strataNames = lodash.uniqBy(r.stratas.map(st => ({
                        strataId: st.strataId,
                        strataName: st.strataName
                    })), "strataId");
                    const countCols = lodash.flatten(strataNames.map(st => [this.getCountColumn(st.strataId), this.getPctColumn(st.strataId)]));
                    strataColumns = [...strataColumns, ...countCols];
                }
            });

            data = Object.values(data);
            stratas = Object.values(stratas);
            stratas = stratas.map(r => ({...r, data: Object.values(r.data), strataColumns, strataNames}));

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
                stratas,
                strataColumns,
                strataNames,
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
                    render: (s, p, d) => this.formatDecimal2(d.avg[i]),
                });
                columns.push({
                    title: 'Std Dev',
                    render: (s, p, d) => this.formatDecimal2(d.stdDev[i]),
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

            analysis.reports = analysis.reports.map(r => ({ ...r, ...this.mapDistributionStratas(r)}));
            let stratas = {};
            const strataNames = lodash.uniqBy(lodash.flatten(analysis.reports.map(r => r.strataNames)), 'strataId');
            const strataColumns = [{
							title: 'Value',
							data: 'name',
							className: this.classes('col-distr-title'),
						}];
            analysis.reports.forEach(r => {
              r.stratas.forEach(st => {
                if (stratas[st.name] === undefined) {
                    stratas[st.name] = {
                        name: st.name,
                        data: {},
                    }
                }
                const strata = stratas[st.name];
                if (strata.data[r.cohortId] === undefined) {
									strata.data[r.cohortId] = {};
								}
								const data = strata.data[r.cohortId];
                const {name, ...values} = st;
								strata.data[r.cohortId] = {...data, ...values};
              });
              strataNames.forEach(st => {
                strataColumns.push({
									title: st.strataName,
									render: (s, p, d) => d.data[r.cohortId][st.strataId] || '0',
                });
              });
            });
            stratas = Object.values(stratas);

            return {
                ...analysis,
                columns: columns,
                data: data,
                strataNames,
                strataColumns,
                stratas,
            };
        }

        convertDistributionAnalysis(analysis) {

            return {
                ...analysis,
                reports: analysis.reports.map(r => ({
                    ...r,
                    data: r.stats,
                    columns: this.distributionColumns,
                    ...this.mapDistributionStratas(r),
                })),
            };
        }

        mapDistributionStratas(r) {

            let stratas = {
              count: {name: 'Count'},
              avg: {name: 'Average'},
              stdDev: {name: 'Std Dev'},
              min: {name: 'Min'},
              p10: {name: 'P10'},
              p25: {name: 'P25'},
              median: {name: 'Median'},
              p75: {name: 'P75'},
              p90: {name: 'P90'},
              max: {name: 'Max'}
            };

            Object.keys(stratas).forEach(prop => {
              const row = stratas[prop];
              r.stratas.forEach(st => {
                if (row[st.strataId] === undefined) {
                  row[st.strataId] = st[prop];
                }
              });
            });

            let strataColumns = [{
              title: 'Value',
              data: 'name',
              className: this.classes('col-distr-title'),
            }];
            const strataNames = lodash.uniqBy(lodash.flatten(r.stratas.map(st => ({
              strataId: st.strataId,
              strataName: st.strataName
            }))), 'strataId');
            stratas = Object.values(stratas);
            strataColumns = [...strataColumns, ...strataNames.map(st => ({
              title: st.strataName,
              render: (s, p, d) => d[st.strataId] || '0',
            }))];

            return { stratas, strataColumns, strataNames };
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
        
        formatDecimal2(val) {
            return numeral(val).format('0.00');
        }

        formatPct(val) {
            return numeral(val).format('0.00') + '%';
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
