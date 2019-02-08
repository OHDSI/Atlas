define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/FeatureAnalysisService',
    'text!./characterization-results.html',
    'appConfig',
    'services/AuthAPI',
    'services/CohortFeatures',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    './utils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'services/MomentAPI',
    'services/Source',
    './explore-prevalence',
    'less!./characterization-results.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
    'components/charts/scatterplot',
    'components/charts/splitBoxplot',
    'd3-scale-chromatic',
], function (
    ko,
    CharacterizationService,
    FeatureAnalysisService,
    view,
    config,
    authApi,
    cohortFeaturesService,
    Component,
    AutoBind,
    commonUtils,
    utils,
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
                render: (d, t, r) => {
                    const analysis = this.analysisList().find(a => a.analysisId === r.analysisId);
                    let html;
                    if (analysis && analysis.analysisId && analysis.type === 'prevalence' && analysis.domainId !== 'DEMOGRAPHICS') {
                        if (r.cohorts.length > 1) {
                          html = d + `<div class='${this.classes({element: 'explore'})}'>Explore ` + r.cohorts.map((c, idx) => {
                            const data = {...r, cohortId: c.cohortId, cohortName: c.cohortName};
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

        get strataNameColumn() {
            return {
              title: 'Strata',
              data: 'strataName',
              className: this.classes('col-distr-title'),
            };
        }

        get stdDiffColumn() {
            return {
              title: 'Std diff',
              render: (s, p, d) => d.stdDiff,
              className: this.classes('col-dist-std-diff'),
              type: 'numberAbs'
            };
        }

        constructor(params) {
            super();

            this.loading = ko.observable(false);
            this.characterizationId = params.characterizationId;

            this.design = ko.observable({});
            this.executionId = params.executionId;
            this.data = ko.observable([]);
            this.domains = ko.observableArray();
            this.filterList = ko.observableArray([]);

            this.analysisList = ko.computed(() => this.prepareTabularData(this.data().analyses, this.filterList()));
            this.stratifiedByTitle = ko.pureComputed(() => this.design().stratifiedBy || '');

            this.groupedScatterColorScheme = d3.schemeCategory10;
            this.scatterXScale = d3.scaleLinear().domain([0, 100]);
            this.scatterYScale = d3.scaleLinear().domain([0, 100]);

            this.executionDesign = ko.observable();
            this.isExecutionDesignShown = ko.observable();
            this.isExplorePrevalenceShown = ko.observable();
            this.explorePrevalence = ko.observable();
            this.explorePrevalenceTitle = ko.observable();
            this.prevalenceStatData = ko.observableArray();

            this.executionId.subscribe(id => id && this.loadData());
            this.loadData();
        }

        formatDate(date) {
            return momentAPI.formatDateTimeUTC(date);
        }

        showExecutionDesign() {
          this.executionDesign(null);
          this.isExecutionDesignShown(true);
          CharacterizationService
            .loadCharacterizationExportDesignByGeneration(this.executionId())
            .then(res => {
              this.executionDesign(res);
              this.loading(false);
            });
        }

        exploreByFeature({covariateName, analysisId, covariateId, cohorts, ...o}, index) {
          const {cohortId, cohortName} = cohorts[index];
          this.explorePrevalence({executionId: this.executionId(), analysisId, cohortId, covariateId, cohortName});
          this.explorePrevalenceTitle('Exploring ' + covariateName);
          this.isExplorePrevalenceShown(true);
        }

        getCountColumn(strata, idx) {
            return {
                title: 'Count',
                render: (s, p, d) => numeral(d.sumValue[strata] && d.sumValue[strata][idx] || 0).format(),
            };
        }

        getPctColumn(strata, idx) {
            return {
                title: 'Pct',
                render: (s, p, d) => utils.formatPct(d.pct[strata] && d.pct[strata][idx] || 0),
            };
        }

        loadData() {
            this.loading(true);

            Promise.all([
                SourceService.loadSourceList(),
                FeatureAnalysisService.loadFeatureAnalysisDomains(),
                CharacterizationService.loadCharacterizationExportDesignByGeneration(this.executionId()),
                CharacterizationService.loadCharacterizationExecution(this.executionId()),
                CharacterizationService.loadCharacterizationResults(this.executionId())
            ]).then(([
                 sourceList,
                 domains,
                 design,
                 execution,
                 resultsList
            ]) => {

                this.design(design);

                this.domains(domains);

                const source = sourceList.find(s => s.sourceKey === execution.sourceKey);

                const result = {
                    sourceId: source.sourceId,
                    sourceKey: source.sourceKey,
                    sourceName: source.sourceName,
                    date: execution.endTime,
                    designHash: execution.hashCode,
                    analyses: lodash.uniqBy(
                        resultsList.map(r => ({
                            analysisId: r.analysisId,
                            domainId: design.featureAnalyses ? design.featureAnalyses.find(fa => fa.name === r.analysisName).domain : null,
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
                        stdDev: r.stdDev,
                        strataId: r.strataId,
                        strataName: r.strataName || 'All stratas',
                    };
                    report.stats.push(stat);
                });

                result.analyses.forEach(a => a.reports.sort((a,b) => a.cohortName.localeCompare(b.cohortName)));

                this.filterList(this.getFilterList(result.analyses));
                this.data(result);
                this.loading(false);
            });
        }

        findDomainById(domainId) {
            const domain = this.domains().find(d => d.id === domainId);
            return domain || {name: 'Unknown'};
        }

        getFilterList(data) {
            const cohorts = lodash.uniqBy(
                lodash.flatten(
                    data.map(a => a.reports.map(r => ({label: r.cohortName, value: r.cohortId})))
                ),
                'value'
            );

            const domains = lodash.uniqBy(
              data.map(a => ({label: this.findDomainById(a.domainId).name, value: a.domainId})),
              "value"
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
                },
                {
                    type: 'multiselect',
                    label: 'Domains',
                    name: 'domains',
                    options: ko.observable(domains),
                    selectedValues: ko.observable(data.map(a => a.domainId)),
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

                const prevalenceAnalyses = analyses.filter(a => a.type === "prevalence");
                if (prevalenceAnalyses.length > 0) {
                  const getAllCohortStats = (cohortId) => {
                    return lodash.flatten(prevalenceAnalyses.map(a => {
                      const analysisName = a.analysisName;
                      const analysisId = a.analysisId;
                      const stats = lodash.flatten(a.reports.filter(r => r.cohortId === cohortId).map(r => r.stats));
                      return stats.map(s => ({...s, analysisName, analysisId}));
                    }));
                  };

                  const firstCohort = analyses[0].reports[0];
                  const secondCohort = analyses[0].reports[1];

                  return {
                    analysisName: 'All prevalence covariates',
                    type: 'prevalence',
                    reports: [
                      {...firstCohort, stats: getAllCohortStats(firstCohort.cohortId)},
                      {...secondCohort, stats: getAllCohortStats(secondCohort.cohortId)}
                    ]
                  };
                }
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

                const stats = analysis.reports.flatMap(r => r.stats);
                const stratifiedCnt = stats.filter(stat => stat.strataId > 0).length;
                analysis.stratified = stratifiedCnt > 0;
                analysis.strataOnly = stratifiedCnt === stats.length;

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

        filterData(data, {cohorts, analyses, domains}) {
            return data.map(analysis => {
                if (!analyses.includes(analysis.analysisId)) {
                    return null;
                }
                if (!domains.includes(analysis.domainId)) {
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
                values: seriesData[key].filter(rd => rd.pct[0][0] && rd.pct[0][1]).map(rd => ({
                    covariateName: rd.covariateName,
                    xValue: rd.pct[0][0] || 0,
                    yValue: rd.pct[0][1] || 0
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

            const data = new Map();

            const strataNames = new Map();

            function PrevalenceStat(rd = {}) {
                this.analysisName = rd.analysisName || analysis.analysisName;
                this.analysisId = analysis.analysisId;
                this.covariateId = rd.covariateId;
                this.covariateName = rd.covariateName;
                this.domainId = rd.domainId;
                this.cohorts = [];
                this.sumValue = {};
                this.pct = {};
            }

            const mapCovariate = (data, report) => (rd) => {
                let cov;
                if (!data.has(rd.covariateId)) {
                    cov = new PrevalenceStat(rd);
                    data.set(rd.covariateId, cov);
                } else {
                    cov = data.get(rd.covariateId);
                }

                if (cov.cohorts.filter(c => c.cohortId === report.cohortId).length === 0) {
                  cov.cohorts.push({cohortId: report.cohortId, cohortName: report.cohortName});
                }
                if (cov.sumValue[rd.strataId] === undefined) {
                    cov.sumValue[rd.strataId] = [];
                }
                cov.sumValue[rd.strataId].push(rd.sumValue);
                if (cov.pct[rd.strataId] === undefined) {
                    cov.pct[rd.strataId] = [];
                }
                cov.pct[rd.strataId].push(rd.pct);
                if (rd.strataId > 0 && !strataNames.has(rd.strataId)) {
                    strataNames.set(rd.strataId, rd.strataName);
                }
            };

            analysis.reports.forEach((r, i) => r.stats.forEach(mapCovariate(data, r)));
            analysis.reports.forEach((r, i) => {
              if (!analysis.strataOnly) {
                columns.push(this.getCountColumn(0, i));
                columns.push(this.getPctColumn(0, i));
              }
              for(let strataId of strataNames.keys()) {
                columns.push(this.getCountColumn(strataId, i));
                columns.push(this.getPctColumn(strataId, i));
              }
            });

            analysis.strataOnly = analysis.strataOnly && data.length > 0;

            if (!analysis.strataOnly && analysis.reports.length === 2) {
                columns.push(this.stdDiffColumn);
                data.forEach(d => d.stdDiff = utils.formatStdDiff(this.calcStdDiffForPrevelanceCovs(
                    {sumValue: d.sumValue[0][0], pct: d.pct[0][0]},
                    {sumValue: d.sumValue[0][1], pct: d.pct[0][1]}
                )));
            }

            return {
                ...analysis,
                columns: columns,
                data: Array.from(data.values()),
                strataNames: Array.from(strataNames.values()),
            };
        }

        convertDistributionComparativeAnalysis(analysis) {
            let columns = [];
            if (analysis.stratified) {
                columns.push(this.strataNameColumn)
            }
            columns.push({
                    title: 'Covariate',
                    data: 'covariateName',
                    className: this.classes('col-dist-title'),
                });

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
                    const key = rd.covariateName + '_' + rd.strataName;
                    if (data[key] === undefined) {
                        data[key] = {
                            strataName: rd.strataName,
                            covariateName: rd.covariateName,
                            count: [],
                            avg: [],
                            stdDev: [],
                            median: [],
                        };
                    }

                    const cov = data[key];

                    cov.count.push(rd.count);
                    cov.avg.push(rd.avg);
                    cov.stdDev.push(rd.stdDev);
                    cov.median.push(rd.median);
                });
            });

            data = Object.values(data);

            if (analysis.reports.length === 2) {
                columns.push(this.stdDiffColumn);
                data.forEach(d => d.stdDiff = utils.formatStdDiff(this.calcStdDiffForDistCovs(
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

        convertDistributionAnalysis(analysis) {

            const columns = (r) => {
                if (analysis.stratified) {
                    return [this.strataNameColumn, ...this.distributionColumns];
                } else {
                    return this.distributionColumns;
                }
            };

            return {
                ...analysis,
                reports: analysis.reports.map(r => ({
                    ...r,
                    data: r.stats,
                    columns: columns(r),
                })),
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

        formatDecimal2(val) {
          return numeral(val).format('0.00');
        }

        analysisTitle(data) {
            const strata = data.stratified ? (' / stratified by ' + this.stratifiedByTitle()): '';
            return ko.computed(() => (data.domainId ? (data.domainId + ' / ') : '') + data.analysisName + strata);
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
