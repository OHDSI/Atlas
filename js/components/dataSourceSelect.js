define([
    'knockout',
    'text!./dataSourceSelect.html',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'atlas-state',
    'services/AuthAPI',
    'services/Vocabulary',
], function (
    ko,
    view,
    Component,
    AutoBind,
    commonUtils,
    sharedState,
    authApi,
    vocabularyProvider,
) {

    class DataSourceSelect extends AutoBind(Component){
        constructor(params) {
            super(params);
            this.conceptSetStore = params.conceptSetStore;
            this.includedConcepts = this.conceptSetStore.includedConcepts;
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
            const results = this.includedConcepts();
            await vocabularyProvider.loadDensity(results, this.currentResultSource().sourceKey);
            this.includedConcepts(results);
            // this.columnHeadersWithIcons.forEach(c => this.toggleCountColumnHeaderSpin(c, false));
            this.recordCountsRefreshing(false);
        }
    }

    return commonUtils.build('datasource-select', DataSourceSelect, view);
});