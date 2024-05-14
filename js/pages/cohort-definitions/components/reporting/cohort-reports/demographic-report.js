define([
    'knockout',
    'services/CohortDefinition',
    'pages/cohort-definitions/components/reporting/cohort-reports/conversion/PrevalenceStatConverter',
    'pages/cohort-definitions/components/reporting/cohort-reports/conversion/DistributionStatConverter',
    'pages/cohort-definitions/components/reporting/cohort-reports/conversion/ComparativeDistributionStatConverter',
	'pages/characterizations/utils',
    'text!./demographic-report.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    './utils',
    'numeral',
    'lodash',
    'd3',
    'components/visualizations/filter-panel/utils',
    'components/conceptset/ConceptSetStore',
    'services/MomentAPI',
    'services/Source',
    'utils/CsvUtils',
    'services/Vocabulary',
    'atlas-state',
    'utils/ExceptionUtils',
    'services/file',
    './explore-prevalence',
    'less!./demographic-report.less',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/line-chart',
    'components/charts/scatterplot',
    'components/charts/splitBoxplot',
    'components/charts/horizontalBoxplot',
    'd3-scale-chromatic',
], function (
    ko,
    CohortDefinitionService,
    PrevalenceStatConverter,
    DistributionStatConverter,
    ComparativeDistributionStatConverter,
    pageUtils,
    view,
    config,
    authApi,
    Component,
    AutoBind,
    commonUtils,
    utils,
    numeral,
    lodash,
    d3,
    filterUtils,
    ConceptSetStore,
    momentAPI,
    SourceService,
    CsvUtils,
    vocabularyProvider,
    sharedState,
    exceptionUtils,
    FileService
) {

	const TYPE_PREVALENCE = 'prevalence';

    class DemographicReportView extends AutoBind(Component) {

        constructor(params) {
            super();
            this.reportType = params.reportType;
            this.cohortId = params.cohortId;
            this.ccGenerateId = params.ccGenerateId;
            this.prevalenceStatConverter = new PrevalenceStatConverter(this.classes);
            this.distributionStatConverter = new DistributionStatConverter(this.classes);
            this.comparativeDistributionStatConverter = new ComparativeDistributionStatConverter(this.classes);
            this.conceptSetStore = ConceptSetStore.characterization();
			this.currentConceptSet = ko.pureComputed(() => this.conceptSetStore.current());
            this.loading = ko.observable(false);

            this.design = ko.observable({});
            this.executionId = ko.observable();
            this.loadedExecutionId = null;
            this.data = ko.observable([]);
            this.domains = ko.observableArray();
            this.filterList = ko.observableArray([]);
            this.selectedItems = ko.pureComputed(() => filterUtils.getSelectedFilterValues(this.filterList()));
            this.selectedItems.subscribe(() =>this.updateData);
            this.analysisList = ko.observableArray([]);
            this.canExportAll = ko.pureComputed(() => this.data().analyses && this.data().analyses.length > 0);
            this.source = ko.pureComputed(() => {
				return sharedState.sources().find(s => s.sourceKey === params.sourceKey());
			});
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
            this.thresholdValuePct = ko.observable();
            this.newThresholdValuePct = ko.observable().extend({ regexp: { pattern: '^(0*100{1,1}\\.?((?<=\\.)0*)?%?$)|(^0*\\d{0,2}\\.?((?<=\\.)\\d*)?%?)$', allowEmpty: false } });
            this.showEmptyResults = ko.observable();
            this.totalResultsCount = ko.observable();
            this.resultsCountFiltered = ko.observable();
            this.downloading = ko.observableArray();
            this.tableOptions = commonUtils.getTableOptions('M');
            this.datatableLanguage = ko.i18n('datatable.language');

            this.loadData();
        }

        isResultDownloading(analysisName) {
            return ko.computed(() => this.downloading().indexOf(analysisName) >= 0);
        }

        isRowGreyed(element, stat) {
            if (stat.stdDiff && Math.abs(stat.stdDiff) < 0.1) {
                element.classList.add(this.classes('greyed-row').trim());
            }
        }

        getButtonsConfig(type, analysis) {
            const buttons = [];

            // buttons.push({
            //     text: ko.i18n('common.export', 'Export')(),
            //     action: ()  => this.exportCSV(analysis, false)
            // });

            // if (analysis.cohorts.length === 2) {
            //     buttons.push({
            //         text: ko.i18n('cc.viewEdit.results.table.buttons.exportComparison', 'Export comparison')(),
            //         action: () => this.exportCSV(analysis, true),
            //     });
            // }

            return buttons;
        }

        formatDate(date) {
            return momentAPI.formatDateTimeUTC(date);
        }

        updateThreshold() {
            this.loadData();
        }

        resultCountText() {
            const values = { resultsCountFiltered: this.resultsCountFiltered(), totalResultsCount: this.resultsCountFiltered() }; // this.totalResultsCount()
            return ko.i18nformat('cc.viewEdit.results.threshold.text', 'Viewing most prevalent <%=resultsCountFiltered%> of total <%=totalResultsCount%> records', values);
        }

        showExecutionDesign() {
          this.executionDesign(null);
          this.isExecutionDesignShown(true);
          CohortDefinitionService
            .loadExportDesignByGeneration(this.executionId())
            .then(res => {
              this.executionDesign(res);
              this.loading(false);
            });
        }

        exploreByFeature({covariateName, analysisId, covariateId, cohorts, ...o}, index) {
          const {cohortId, cohortName} = cohorts[index];
          this.explorePrevalence({executionId: this.executionId(), analysisId, cohortId, covariateId, cohortName});
          this.explorePrevalenceTitle(ko.i18n('cc.viewEdit.results.exploring', 'Exploring')() + ' ' + covariateName);
          this.isExplorePrevalenceShown(true);
        }

        async createNewSet(analysis) {
            this.loading(true);
            const conceptIds = this.extractConceptIds(analysis);
            const items = await vocabularyProvider.getConceptsById(conceptIds);
            await this.initConceptSet(items.data);
            this.showConceptSet();
            this.loading(false);
        }

        extractConceptIds(analysis) {
            const conceptIds = [];
            analysis.data.forEach(r => {
        	if (r.conceptId > 0) {
        		conceptIds.push(r.conceptId);
        	}
            });
            return conceptIds;
        }

        showConceptSet() {
            commonUtils.routeTo('/conceptset/0/details');
        }

        async initConceptSet(conceptSetItems) {
            this.currentConceptSet({
                name: ko.observable('New Concept Set'),
                id: 0,
            });
            this.currentConceptSetSource('repository');
            for (let i = 0; i < conceptSetItems.length; i++) {
                if (!sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID]) {
                    let conceptSetItem = commonUtils.createConceptSetItem(conceptSetItems[i]);
                    sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] = {
                        isExcluded: conceptSetItem.isExcluded,
                        includeDescendants: conceptSetItem.includeDescendants,
                        includeMapped: conceptSetItem.includeMapped,
                    };
                    sharedState.selectedConcepts.push(conceptSetItem);
                }
            }
        }

        toggleEmptyResults() {
            this.showEmptyResults(!this.showEmptyResults());
            this.updateData();
        }

        async loadData() {
            this.loading(true);

            Promise.all([
                CohortDefinitionService.getReport(this.cohortId(), this.source().sourceKey, this.reportType, this.ccGenerateId())
            ]).then(([
                generationResults
            ]) => {
                const count = generationResults?.demographicsStats?.length ?  (generationResults.demographicsStats.reduce((prev, curr) => [...prev, ...curr.items],[]) || []).length : 0;
                this.thresholdValuePct((generationResults.prevalenceThreshold || 0.01) * 100);
                this.newThresholdValuePct(this.thresholdValuePct());
                this.showEmptyResults(generationResults.showEmptyResults || null);
                this.resultsCountFiltered(generationResults.count || count);
                this.getData(generationResults?.demographicsStats); 
                this.loading(false);
            });
        }

        getData(resultsList) {
            const result = {
                ...this.data(),
                sourceId: this.source().sourceId,
                sourceKey: this.source().sourceKey,
                sourceName: this.source().sourceName,
                analyses: lodash.sortBy(
                    lodash.uniqBy(
                        resultsList?.map(r => ({
                            analysisId: r.analysisId,
                            domainId: this.design() && this.design().featureAnalyses && !r.isSummary ?
															(this.design().featureAnalyses.find(fa => fa.id === r.id) || { })[ 'domain' ] : null,
                            rawAnalysisName: r.analysisName,
                            analysisName: this.getAnalysisName(r.analysisName, { faType: r.faType, statType: r.resultType }),
                            cohorts: r.cohorts,
                            domainIds: r.domainIds,
                            type: r.resultType.toLowerCase(),
                            isSummary: r.isSummary,
                            isComparative: r.isComparative,
                            items: r.items,
                        })),
                        'analysisId'
                    ),
                    [( a ) => { return a.analysisId || ''}], ['desc']
                ),
            }
            this.data(result);
            this.prepareTabularData();
        }

        getAnalysisName(rawName, { faType, statType }) {
            return rawName + ((faType === 'PRESET' && statType.toLowerCase() === TYPE_PREVALENCE) ? ` (prevalence > ${this.newThresholdValuePct()}%)` : '');
        }

        // async exportCSV(analysis, isComparative) {
        //     try {
        //         this.downloading.push(analysis.analysisName);
        //         let filterParams = filterUtils.getSelectedFilterValues(this.filterList());
        //         let params = {
        //             cohortIds: analysis.cohorts.map(c => c.cohortId),
        //             analysisIds: analysis.analysisId ? [analysis.analysisId] : filterParams.analyses,
        //             domainIds: analysis.domainIds,
        //             isSummary: analysis.isSummary,
        //             isComparative: isComparative,
        //             thresholdValuePct: this.thresholdValuePct() / 100,
        //             showEmptyResults: !!this.showEmptyResults(),
        //         };
        //         await FileService.loadZip(`${config.api.url}cohort-characterization/generation/${this.executionId()}/result/export`,
        //             `characterization_${this.characterizationId()}_execution_${this.executionId()}_report.zip`, 'POST', params);

        //     }catch (e) {
        //         alert(exceptionUtils.translateException(e));
        //     } finally {
        //         this.downloading.remove(analysis.analysisName);
        //     }
        // }

        findDomainById(domainId) {
            const domain = this.domains().find(d => d.id === domainId);
            return domain || {name: 'Unknown'};
        }

        sortedStrataNames(strataNames) {
            return utils.sortedStrataNames(strataNames, true);
        }

        prepareTabularData() {
            if (!this.data().analyses || this.data().analyses.length === 0) {
                this.analysisList([]);
                return;
            }

            const designStratas = this.showEmptyResults() ? this.design().stratas.map(s => ({ strataId: s.id, strataName: s.name })) : null;

            const convertedData = this.data().analyses.map(analysis => {
                let converter;
                if (analysis.type === TYPE_PREVALENCE) {
                    converter = this.prevalenceStatConverter;
                } else {
                    if (analysis.isComparative) {
                        converter = this.comparativeDistributionStatConverter;
                    } else {
                        converter = this.distributionStatConverter;
                    }
                }
                return converter.convertAnalysisToTabularData(analysis, designStratas);
            });
            this.analysisList(convertedData);
        }

        tooltipBuilder(d) {
            return `
                <div>${ko.i18n('cc.viewEdit.results.series', 'Series')()}: ${d.seriesName}</div>
                <div>${ko.i18n('cc.viewEdit.results.covariate', 'Covariate')()}: ${d.covariateName}</div>
                <div>X: ${d3.format('.2f')(d.xValue)}%</div>
                <div>Y: ${d3.format('.2f')(d.yValue)}%</div>
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

        getBoxplotStruct(cohort, stat) {
            return {
            Category: cohort.cohortName,
            min: stat.min[0][cohort.cohortId],
            max: stat.max[0][cohort.cohortId],
            median: stat.median[0][cohort.cohortId],
            LIF: stat.p10[0][cohort.cohortId],
            q1: stat.p25[0][cohort.cohortId],
            q3: stat.p75[0][cohort.cohortId],
            UIF: stat.p90[0][cohort.cohortId]
            };
        }

        convertBoxplotData(analysis) {
            return [{
                target: this.getBoxplotStruct(analysis.cohorts[0], analysis.data[0]),
                compare: this.getBoxplotStruct(analysis.cohorts[1],  analysis.data[0]),
            }];
        }

        convertHorizontalBoxplotData(analysis) {
            return analysis.cohorts.map(cohort => {
                return this.getBoxplotStruct(cohort, analysis.data[0]);
            });
        }

        prepareLegendBoxplotData (analysis) {
            const cohortNames = analysis.cohorts.map(d => d.cohortName);
            const legendColorsSchema = d3.scaleOrdinal().domain(cohortNames)
                .range(utils.colorHorizontalBoxplot);

            const legendColors = cohortNames.map(cohort => {
                return {
                    cohortName: cohort,
                    cohortColor: legendColorsSchema(cohort)
                };
            });
            return legendColors.reverse();
        }

        analysisTitle(data) {
            const strata = data.stratified ? (' / stratified by ' + this.stratifiedByTitle()): '';
            return (data.domainId ? (data.domainId + ' / ') : '') + data.analysisName + strata;
        }
    }

    return commonUtils.build('demographic-report', DemographicReportView, view);
});
