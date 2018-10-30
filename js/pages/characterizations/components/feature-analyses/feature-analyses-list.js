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
            if (this.isGetListPermitted()) {
                this.ajax = FeatureAnalysisService.loadFeatureAnalysisList;
            }

            this.gridColumns = [
                {
                    title: 'Name',
                    data: 'name',
                    searchable: true,
                    className: this.classes('tbl-col', 'name'),
                    render: datatableUtils.getLinkFormatter(d => ({
                        link: '#/cc/feature-analyses/' + d.id,
                        label: d['name']
                    })),
                },
                {
                    title: 'Description',
                    data: 'descr',
                    className: this.classes('tbl-col', 'descr'),
                },
                // {
                //     title: 'Created',
                //     className: this.classes('tbl-col', 'created'),
                //     type: 'date',
                //     render: datatableUtils.getDateFieldFormatter(),
                // },
                // {
                //     title: 'Updated',
                //     className: this.classes('tbl-col', 'updated'),
                //     type: 'date',
                //     render: datatableUtils.getDateFieldFormatter(),
                // },
                // {
                //     title: 'Author',
                //     className: this.classes('tbl-col', 'author'),
                //     render: datatableUtils.getCreatedByFormatter(),
                // },

            ];
            this.gridOptions = {
	            entityName: 'fe_analysis',
                Facets: [
                    {
                        'caption': 'Type',
                        'binding': (o) => constants.feAnalysisTypes[o.type]
                    },
                    // {
                    //     'caption': 'Created',
                    //     'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
                    // },
                    // {
                    //     'caption': 'Updated',
                    //     'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
                    // },
                    // {
                    //     'caption': 'Author',
                    //     'binding': datatableUtils.getFacetForCreatedBy,
                    // },
                ]
            };
        }

         isGetListPermitted() {
            return PermissionService.isPermittedGetFaList();
        }

        isCreatePermitted() {
            return PermissionService.isPermittedCreateFa();
        }

        createFeature() {
            commonUtils.routeTo('/cc/feature-analyses/0');
        }
    }

    return commonUtils.build('feature-analyses-list', FeatureAnalyses, view);
});
