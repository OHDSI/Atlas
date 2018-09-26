define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'text!./feature-analyses-browser.html',
    'appConfig',
    'services/AuthService',
    'providers/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    '../tabbed-grid',
    'less!./feature-analyses-browser.less',
], function (
    ko,
    FeatureAnalysisService,
    view,
    config,
    AuthService,
    Component,
    commonUtils,
    datatableUtils
) {
    class FeatureAnalysesBrowser extends Component {
        constructor(params) {
            super();

            this.selectedAnalysis = params.selectedAnalysis;

            this.data = ko.observableArray();
            this.loading = ko.observable(false);
            this.config = config;

            this.options = {
                Facets: [
                    {
                        'caption': 'Updated',
                        'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
                    },
                    {
                        'caption': 'Author',
                        'binding': o => o.createdBy,
                    },
                ]
            };

            this.columns = [
                {
                    title: 'ID',
                    data: 'id'
                },
                {
                    title: 'Name',
                    render: datatableUtils.getLinkFormatter(d => ({ label: d['name'] })),
                },
                {
                    title: 'Description',
                    data: 'description'
                }
            ];

            this.selectAnalysis = this.selectAnalysis.bind(this);

            this.loadData();
        }

        loadData() {
            this.loading(true);
            FeatureAnalysisService
                .loadFeatureAnalysisList()
                .then(res => {
                    this.data(res.content);
                    this.loading(false);
                });
        }

        selectAnalysis(data) {
            this.selectedAnalysis(data);
        }
    }

    return commonUtils.build('feature-analyses-browser', FeatureAnalysesBrowser, view);
});
