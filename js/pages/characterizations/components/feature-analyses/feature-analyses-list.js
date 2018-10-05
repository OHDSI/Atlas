define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'pages/characterizations/services/PermissionService',
    'text!./feature-analyses-list.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Page',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
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
) {
    class FeatureAnalyses extends Page {
        constructor(params) {
            super(params);

            this.gridTab = constants.featureAnalysesTab;

            this.loading = ko.observable(false);
            this.data = ko.observableArray();

            this.gridColumns = [
                {
                    title: 'Name',
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
                    render: datatableUtils.getLinkFormatter(d => ({
                        link: '#/cc/feature-analyses/' + d.id,
                        label: d['name']
                    })),
                },
                {
                    title: 'Description',
                    data: 'description',
                    className: this.classes('tbl-col', 'descr'),
                },
                {
                    title: 'Created',
                    className: this.classes('tbl-col', 'created'),
                    type: 'date',
                    render: datatableUtils.getDateFieldFormatter(),
                },
                {
                    title: 'Updated',
                    className: this.classes('tbl-col', 'updated'),
                    type: 'date',
                    render: datatableUtils.getDateFieldFormatter(),
                },
                {
                    title: 'Author',
                    className: this.classes('tbl-col', 'author'),
                    render: datatableUtils.getCreatedByFormatter(),
                },

            ];
            this.gridOptions = {
                Facets: [
                    {
                        'caption': 'Type',
                        'binding': (o) => constants.feAnalysisTypes[o.type]
                    },
                    {
                        'caption': 'Created',
                        'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
                    },
                    {
                        'caption': 'Updated',
                        'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
                    },
                    {
                        'caption': 'Author',
                        'binding': datatableUtils.getFacetForCreatedBy,
                    },
                ]
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
            this.data(res.content);
            this.loading(false);
        }

        createFeature() {
            commonUtils.routeTo('/cc/feature-analyses/0');
        }
    }

    return commonUtils.build('feature-analyses-list', FeatureAnalyses, view);
});
