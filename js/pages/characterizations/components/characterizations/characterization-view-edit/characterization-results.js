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
    'services/Vocabulary',
    'atlas-state',
    'utils/ExceptionUtils',
    'services/file',
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
    vocabularyProvider,
    sharedState,
    exceptionUtils,
    FileService
) {

	const TYPE_PREVALENCE = 'prevalence';

    class CharacterizationViewEditResults extends AutoBind(Component) {

        constructor(params) {
            super();


            this.prevalenceStatConverter = new PrevalenceStatConverter(this.classes);
            this.distributionStatConverter = new DistributionStatConverter(this.classes);
            this.comparativeDistributionStatConverter = new ComparativeDistributionStatConverter(this.classes);
            this.currentConceptSet = sharedState.ConceptSet.current;
            this.currentConceptSetSource = sharedState.ConceptSet.source;
            this.loading = ko.observable(false);
            this.characterizationId = params.characterizationId;

            this.design = ko.observable({});
            this.executionId = params.executionId;
            this.data = ko.observable([]);
            this.domains = ko.observableArray();
            this.filterList = ko.observableArray([]);
            this.selectedItems = ko.computed(() => filterUtils.getSelectedFilterValues(this.filterList()));
            this.analysisList = ko.observableArray([]);

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
            this.totalResultsCount = ko.observable();
            this.resultsCountFiltered = ko.observable();
            this.downloading = ko.observableArray();

            this.executionId.subscribe(id => id && this.loadData());
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

            buttons.push({
                text: 'Export',
                action: ()  => this.exportCSV(analysis, false)
            });

            if (analysis.cohorts.length === 2) {
                buttons.push({
                    text: 'Export comparison',
                    action: () => this.exportCSV(analysis, true),
                });
            }

           /*
            * Taking this out per https://github.com/OHDSI/Atlas/issues/1834

           if (this.extractConceptIds(analysis).length > 0) {
                buttons.push({
                    text: 'Create new Concept Set',
                    action: () => this.createNewSet(analysis)
                });
            }

            */

            return buttons;
        }

        formatDate(date) {
            return momentAPI.formatDateTimeUTC(date);
        }

        updateThreshold() {
            this.updateData();
        }

        resultCountText() {
            return `Viewing most prevalent ${this.resultsCountFiltered()} of total ${this.totalResultsCount()} records`;
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
            commonUtils.routeTo('#/conceptset/0/details');
        }

        async initConceptSet(conceptSetItems) {
            this.currentConceptSet({
                name: ko.observable('New Concept Set'),
                id: 0,
            });
            this.currentConceptSetSource('repository');
            for (let i = 0; i < conceptSetItems.length; i++) {
                if (sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] !== 1) {
                    sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] = 1;
                    let conceptSetItem = commonUtils.createConceptSetItem(conceptSetItems[i]);
                    sharedState.selectedConcepts.push(conceptSetItem);
                }
            }
        }

        loadData() {
            this.loading(true);

            let {cohorts, analyses, domains} = filterUtils.getSelectedFilterValues(this.filterList());
            let params = {
                cohortIds: cohorts,
                analysisIds: analyses,
                domainIds: domains,
                thresholdValuePct: this.thresholdValuePct() / 100
            };

            Promise.all([
                SourceService.loadSourceList(),
                FeatureAnalysisService.loadFeatureAnalysisDomains(),
                CharacterizationService.loadCharacterizationExportDesignByGeneration(this.executionId()),
                CharacterizationService.loadCharacterizationExecution(this.executionId()),
                CharacterizationService.loadCharacterizationResults(this.executionId(), params),
                CharacterizationService.loadCharacterizationResultsCount(this.executionId()),
            ]).then(([
                 sourceList,
                 domains,
                 design,
                 execution,
                 generationResults,
                 totalCount,
            ]) => {
                this.design(design);
                this.domains(domains);
                this.totalResultsCount(totalCount);
                this.thresholdValuePct(generationResults.prevalenceThreshold * 100);
                this.newThresholdValuePct(this.thresholdValuePct());
                this.resultsCountFiltered(generationResults.count);

                const source = sourceList.find(s => s.sourceKey === execution.sourceKey);

                const result = {
                    sourceId: source.sourceId,
                    sourceKey: source.sourceKey,
                    sourceName: source.sourceName,
                    date: execution.endTime,
                    designHash: execution.hashCode,
                }
                
                this.data(result);

                this.getData(generationResults.reports);
                this.loading(false);
                
                this.filterList(this.getFilterList(this.data().analyses));
                this.selectedItems.subscribe(this.updateData);
            });
        }

        updateData() {
            this.loading(true);

            let {cohorts, analyses, domains} = filterUtils.getSelectedFilterValues(this.filterList());
            let params = {
                cohortIds: cohorts,
                analysisIds: analyses,
                domainIds: domains,
                thresholdValuePct: this.thresholdValuePct() / 100
            };

            Promise.all([
                CharacterizationService.loadCharacterizationResults(this.executionId(), params)
            ]).then(([
                generationResults
            ]) => {
                this.resultsCountFiltered(generationResults.count);
                this.getData(generationResults.reports);
                this.loading(false);
            });
        }

        getData(resultsList) {
            const result = {
                ...this.data(),
                analyses: lodash.sortBy(
                    lodash.uniqBy(
                        resultsList.map(r => ({
                            analysisId: r.analysisId,
                            domainId: this.design() && this.design().featureAnalyses && !r.isSummary ?
															(this.design().featureAnalyses.find(fa => fa.id === r.id) || { })[ 'domain' ] : null,
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

            return rawName + ((faType === 'PRESET' && statType.toLowerCase() === TYPE_PREVALENCE) ? ` (prevalence > ${this.thresholdValuePct()}%)` : '');
        }

        async exportAllCSV() {
            try {
                this.downloading.push('__ALL__');
                let {cohorts, analyses, domains} = filterUtils.getSelectedFilterValues(this.filterList());
                let params = {
                    cohortIds: cohorts,
                    analysisIds: analyses,
                    domainIds: domains,
                    thresholdValuePct: this.thresholdValuePct() / 100
                };
                await FileService.loadZip(`${config.api.url}cohort-characterization/generation/${this.executionId()}/result/export`,
                    `characterization_${this.characterizationId()}_execution_${this.executionId()}_reports.zip`, 'POST', params);

            }catch (e) {
                alert(exceptionUtils.translateException(e));
            } finally {
                this.downloading.remove('__ALL__');
            }
        }

        async exportCSV(analysis, isComparative) {
            try {
                this.downloading.push(analysis.analysisName);
                let filterParams = filterUtils.getSelectedFilterValues(this.filterList());
                let params = {
                    cohortIds: analysis.cohorts.map(c => c.cohortId),
                    analysisIds: analysis.analysisId ? [analysis.analysisId] : filterParams.analyses,
                    domainIds: analysis.domainIds,
                    isSummary: analysis.isSummary,
                    isComparative: isComparative,
                    thresholdValuePct: this.thresholdValuePct() / 100
                };
                await FileService.loadZip(`${config.api.url}cohort-characterization/generation/${this.executionId()}/result/export`,
                    `characterization_${this.characterizationId()}_execution_${this.executionId()}_report.zip`, 'POST', params);

            }catch (e) {
                alert(exceptionUtils.translateException(e));
            } finally {
                this.downloading.remove(analysis.analysisName);
            }
        }

        findDomainById(domainId) {
            const domain = this.domains().find(d => d.id === domainId);
            return domain || {name: 'Unknown'};
        }

        getFilterList(data) {
            const cohorts = lodash.uniqBy(
                lodash.flatten(
                    lodash.flatten(
                       data.map(a => a.cohorts.map(c => ({label: c.cohortName, value: parseInt(c.cohortId)})))
                    )
                ),
                'value'
            );

            const domains = lodash.uniqBy(
                lodash.flatten(
                    data.map(a => a.domainIds.map(d => ({label: this.findDomainById(d).name, value: d})))
                ),
                "value"
            );

            const analyses = lodash.uniqBy(
                data.filter(a => a.analysisId).map(a => ({label: a.analysisName, value: a.analysisId})),
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
                    options: ko.observable(analyses),
                    selectedValues: ko.observable(analyses.map(c => c.value)),
                },
                {
                    type: 'multiselect',
                    label: 'Domains',
                    name: 'domains',
                    options: ko.observable(domains),
                    selectedValues: ko.observable(domains.map(c => c.value)),
                }
            ];
        }

        sortedStrataNames(strataNames) {
            return characterizationUtils.sortedStrataNames(strataNames, true);
        }

        prepareTabularData() {
            if (!this.data().analyses || this.data().analyses.length === 0) {
                this.analysisList([]);
                return;
            }

            const convertedData = this.data().analyses.map(analysis => {
                let convertedAnalysis;
                if (analysis.type === TYPE_PREVALENCE) {
                    convertedAnalysis = this.prevalenceStatConverter.convertAnalysisToTabularData(analysis);
                } else {
                    if (analysis.isComparative) {
                        convertedAnalysis = this.comparativeDistributionStatConverter.convertAnalysisToTabularData(analysis);
                    } else {
                        convertedAnalysis = this.distributionStatConverter.convertAnalysisToTabularData(analysis);
                    }
                }
                return convertedAnalysis;
            });

            this.analysisList(convertedData);
        }

        tooltipBuilder(d) {
            return `
                <div>Series: ${d.seriesName}</div>
                <div>Covariate: ${d.covariateName}</div>
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

        canExportAll() {
            return ko.computed(() => this.data().analyses && this.data().analyses.length > 0);
        }
    }

    return commonUtils.build('characterization-view-edit-results', CharacterizationViewEditResults, view);
});
