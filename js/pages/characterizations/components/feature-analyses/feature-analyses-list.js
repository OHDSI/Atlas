define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'text!./feature-analyses-list.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    '../tabbed-grid',
    'less!./feature-analyses-list.less',
], function (
    ko,
    FeatureAnalysisService,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    datatableUtils,
    constants,
) {
    class FeatureAnalyses extends Component {
        constructor(params) {
            super();

            this.gridTab = constants.featureAnalysesTab;

            this.loading = ko.observable(false);
            this.data = ko.observableArray();

            this.gridColumns = [
                {
                    title: 'Name',
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
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
                    data: 'createdBy.name',
                    className: this.classes('tbl-col', 'author'),
                },

            ];
            this.gridOptions = {
                Facets: [
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
                        'binding': o => o.createdBy.name,
                    },
                ]
            };

            this.loadData();
        }

        loadData() {
            this.loading(true);
            FeatureAnalysisService
                .loadFeatureAnalysisList()
                .then(res => {
                    this.data(res);
                    this.loading(false);
                });
        }
    }

    return commonUtils.build('feature-analyses-list', FeatureAnalyses, view);
});
