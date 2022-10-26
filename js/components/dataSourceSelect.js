define([
    'knockout',
    'text!./dataSourceSelect.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'atlas-state',
    'services/AuthAPI',
    'services/Vocabulary',
    'components/conceptset/const'
], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    sharedState,
    authApi,
    vocabularyProvider,
    constants
) {

    class DataSourceSelect extends AutoBind(Component){
        constructor(params) {
            super(params);
            this.conceptSetStore = params.conceptSetStore;
            this.includedConcepts = this.conceptSetStore.includedConcepts;
            this.includedSourcecodes = this.conceptSetStore.includedSourcecodes;
            this.currentConseptSetTab = this.conceptSetStore.currentConseptSetTab;
            this.commonUtils = commonUtils;
            this.loading = params.loading;
            this.currentResultSource = ko.observable();
            this.resultSources = ko.computed(() => {
                const resultSources = [];
                sharedState.sources().forEach((source) => {
                    if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
                        resultSources.push(source);
                        if (source.resultsUrl === sharedState.resultsUrl()) {
                            this.currentResultSource(source);
                        }
                    }
                })
                return resultSources;
            });

            this.recordCountsRefreshing = ko.observable(false);
            this.recordCountClass = ko.pureComputed(() => {
                return this.recordCountsRefreshing() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-database fa-lg";
            });
        }


        async refreshRecordCounts(obj, event) {
            if (!event.originalEvent) {
                return;
            }
            this.recordCountsRefreshing(true);
            // this.columnHeadersWithIcons.forEach(c => this.toggleCountColumnHeaderSpin(c, true));
            const currentResultSource = this.resultSources().find(source => source.sourceId == event.target.value)
            this.currentResultSource(currentResultSource);

            const { ViewMode } = constants;
            switch (this.currentConseptSetTab()) {
                case ViewMode.INCLUDED:
                    const resultsIncludedConcepts = this.includedConcepts();
                    await vocabularyProvider.loadDensity(resultsIncludedConcepts, this.currentResultSource().sourceKey);
                    this.includedConcepts(resultsIncludedConcepts);
                    break;
                case ViewMode.SOURCECODES:
                    const resultsIncludedSourcecodes = this.includedSourcecodes();
                    await vocabularyProvider.loadDensity(resultsIncludedSourcecodes, this.currentResultSource().sourceKey);
                    this.includedSourcecodes(resultsIncludedSourcecodes);
                    break;
            }
            this.recordCountsRefreshing(false);
        }
    }

    return commonUtils.build('datasource-select', DataSourceSelect, view);
});