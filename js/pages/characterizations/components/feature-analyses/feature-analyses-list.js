define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'pages/characterizations/services/PermissionService',
    'text!./feature-analyses-list.html',
    'appConfig',
    'services/AuthAPI',
    'pages/Page',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    './const',
    '../tabbed-grid',
    'less!./feature-analyses-list.less',
], function (
    ko,
    FeatureAnalysisService,
    PermissionService,
    view,
    config,
    authApi,
    Page,
    commonUtils,
    datatableUtils,
    constants,
    feConst,
) {
    class FeatureAnalyses extends Page {
        constructor(params) {
            super(params);

            this.gridTab = constants.featureAnalysesTab;

            this.loading = ko.observable(false);
            this.data = ko.observableArray();

            this.gridColumns = feConst.FeatureAnalysisColumns(this.classes);
            this.gridOptions = {
                Facets: feConst.FeatureAnalysisFacets,
            };
        }

        onRouterParamsChanged() {
            this.isGetListPermitted() && this.loadData();
        }

        isGetListPermitted() {
            return PermissionService.isPermittedGetFaList();
        }

        isCreatePermitted() {
            return PermissionService.isPermittedCreateFa();
        }

        async loadData() {
            this.loading(true);
            const res = await FeatureAnalysisService.loadFeatureAnalysisList();
            datatableUtils.coalesceField(res.content, 'modifiedDate', 'createdDate');
            this.data(res.content);
            this.loading(false);
        }

        createFeature() {
            commonUtils.routeTo('/cc/feature-analyses/0');
        }
    }

    return commonUtils.build('feature-analyses-list', FeatureAnalyses, view);
});
