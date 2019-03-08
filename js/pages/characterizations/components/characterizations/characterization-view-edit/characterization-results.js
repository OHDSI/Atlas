define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/FeatureAnalysisService',
    'pages/characterizations/services/conversion/PrevalenceStatConverter',
    'pages/characterizations/services/conversion/DistributionStatConverter',
    'pages/characterizations/services/conversion/ComparativeDistributionStatConverter',
	'pages/characterizations/utils',
    'text!./characterization-results.html',
    'appConfig',
    'services/AuthAPI',
    'services/CohortFeatures',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    './utils',
    '../../../utils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'services/MomentAPI',
    'services/Source',
    'utils/CsvUtils',
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
    PrevalenceStatConverter,
    DistributionStatConverter,
    ComparativeDistributionStatConverter,
    pageUtils,
    view,
    config,
    authApi,
    cohortFeaturesService,
    Component,
    AutoBind,
    commonUtils,
    utils,
    characterizationUtils,
    numeral,
    lodash,
    d3,
    filterUtils,
    momentAPI,
    SourceService,
    CsvUtils,
) {

    class CharacterizationViewEditResults extends AutoBind(Component) {

        constructor(params) {
            super();

            this.prevalenceStatConverter = new PrevalenceStatConverter(this.classes);
            this.distributionStatConverter = new DistributionStatConverter(this.classes);
            this.comparativeDistributionStatConverter = new ComparativeDistributionStatConverter(this.classes);

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

        getButtonsConfig(type, analysis) {
            const buttons = [];

            buttons.push({
                text: 'Export',
                action: ()  => this.exportTable(analysis, type)
            });

            if (analysis.cohorts.length === 2) {
                buttons.push({
                    text: 'Export comparison',
                    action: () => this.exportComparison(analysis),
                });
            }

            return buttons;
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

        exportTable(analysis, type) {
            const exprt = [];
            analysis.data.forEach(stat => {
                for (let strataId of analysis.strataNames.keys()) {
                    for (let cohort of analysis.cohorts) {
                        if (stat.count[strataId] && stat.count[strataId][cohort.cohortId]) {
                            exprt.push({
                                'Analysis ID ': stat.analysisId || analysis.analysisId,
                                'Analysis name': stat.analysisName || analysis.analysisName,
                                'Strata ID': stat.strataId || strataId,
                                'Strata name': stat.strataName || analysis.strataNames.get(strataId),
                                'Cohort ID': cohort.cohortId,
                                'Cohort name': cohort.cohortName,
                                'Covariate ID': stat.covariateId,
                                'Covariate name': stat.covariateName,
                                'Covariate short name': pageUtils.extractMeaningfulCovName(stat.covariateName),
                                'Count': stat.count[strataId][cohort.cohortId],
                                ...(
                                    type === 'prevalence'
                                    ? { 'Percent': stat.pct[strataId][cohort.cohortId] }
                                    : {
                                        'Avg': stat.avg[strataId][cohort.cohortId],
                                        'StdDev': stat.stdDev[strataId][cohort.cohortId],
                                        'Min': stat.min[strataId][cohort.cohortId],
                                        'P10': stat.p10[strataId][cohort.cohortId],
                                        'P25': stat.p25[strataId][cohort.cohortId],
                                        'Median': stat.median[strataId][cohort.cohortId],
                                        'P75': stat.p75[strataId][cohort.cohortId],
                                        'P90': stat.p90[strataId][cohort.cohortId],
                                        'Max': stat.max[strataId][cohort.cohortId],
                                    }
                                )
                            });
                        }
                    }
                }
            });
            CsvUtils.saveAsCsv(exprt);
        }

        exportComparison(analysis) {
            const exprt = [];
            analysis.data.forEach(stat => {
                for (let strataId of analysis.strataNames.keys()) {
                    exprt.push({
                        'Analysis ID': stat.analysisId || analysis.analysisId,
                        'Analysis name': stat.analysisName || analysis.analysisName,
                        'Strata ID': stat.strataId || strataId,
                        'Strata name': stat.strataName || analysis.strataNames.get(strataId),
                        'Target cohort ID': analysis.cohorts[0].cohortId,
                        'Target cohort name': analysis.cohorts[0].cohortName,
                        'Comparator cohort ID': analysis.cohorts[1].cohortId,
                        'Comparator cohort name': analysis.cohorts[1].cohortName,
                        'Covariate ID': stat.covariateId,
                        'Covariate name': stat.covariateName,
                        'Covariate short name': pageUtils.extractMeaningfulCovName(stat.covariateName),
                        'Target count': stat.count[strataId] ? stat.count[strataId][analysis.cohorts[0].cohortId] : '',
                        'Target percent': stat.pct[strataId] ? stat.pct[strataId][analysis.cohorts[0].cohortId] : '',
                        'Comparator count': stat.count[strataId] ? stat.count[strataId][analysis.cohorts[1].cohortId] : '',
                        'Comparator percent': stat.pct[strataId] ? stat.pct[strataId][analysis.cohorts[1].cohortId] : '',
                        'Std. Diff Of Mean': stat.stdDiff,
                    });
                }
            });
            CsvUtils.saveAsCsv(exprt);
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
                        conceptName: r.conceptName,
                        avg: r.avg,
                        count: r.count,
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

        sortedStrataNames(strataNames) {
            return characterizationUtils.sortedStrataNames(strataNames, true);
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
                      const domainId = a.domainId;
                      const stats = lodash.flatten(a.reports.filter(r => r.cohortId === cohortId).map(r => r.stats));
                      return stats.map(s => ({...s, analysisName, analysisId, domainId}));
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

                if (analysis.type === 'prevalence') {
                    convertedAnalysis = this.prevalenceStatConverter.convertAnalysisToTabularData(analysis);
                } else {
                    if (this.isComparatativeMode(filters)) {
                        convertedAnalysis = this.comparativeDistributionStatConverter.convertAnalysisToTabularData(analysis);
                    } else {
                        convertedAnalysis = this.distributionStatConverter.convertAnalysisToTabularData(analysis);
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
            const firstCohortId = analysis.cohorts[0].cohortId;
            const secondCohortId = analysis.cohorts[1].cohortId;
            return Object.keys(seriesData).map(key => ({
                name: key,
                values: seriesData[key].filter(rd => rd.pct[0][firstCohortId] && rd.pct[0][secondCohortId]).map(rd => ({
                    covariateName: rd.covariateName,
                    xValue: rd.pct[0][firstCohortId] || 0,
                    yValue: rd.pct[0][secondCohortId] || 0
                })),
            }));
        }

        convertBoxplotData(analysis) {

            const getBoxplotStruct = (cohort, stat) => ({
                Category: cohort.cohortName,
                min: stat.min[0][cohort.cohortId],
                max: stat.max[0][cohort.cohortId],
                median: stat.median[0][cohort.cohortId],
                LIF: stat.p10[0][cohort.cohortId],
                q1: stat.p25[0][cohort.cohortId],
                q3: stat.p75[0][cohort.cohortId],
                UIF: stat.p90[0][cohort.cohortId]
            });

            return [{
                target: getBoxplotStruct(analysis.cohorts[0], analysis.data[0]),
                compare: getBoxplotStruct(analysis.cohorts[1],  analysis.data[0]),
            }]
        }

        analysisTitle(data) {
            const strata = data.stratified ? (' / stratified by ' + this.stratifiedByTitle()): '';
            return ko.computed(() => (data.domainId ? (data.domainId + ' / ') : '') + data.analysisName + strata);
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
