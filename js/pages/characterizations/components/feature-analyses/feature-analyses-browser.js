define([
    'knockout',
    'atlas-state',
    'text!./feature-analyses-browser.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'text!pages/characterizations/stubs/feature-analyses-list.json',
    'pages/characterizations/const',
    '../tabbed-grid',
    'less!./feature-analyses-browser.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    datatableUtils,
    featureAnalysesList
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
                    render: datatableUtils.getLinkFormatter({ labelField: 'name' }),
                },
                {
                    title: 'Description',
                    data: 'description'
                },
                {
                    title: 'Author',
                    data: 'createdBy.name'
                }
            ];

            this.loadAnalyses = this.loadAnalyses.bind(this);
            this.selectAnalysis = this.selectAnalysis.bind(this);

            this.loadAnalyses();
        }

        loadAnalyses() {
            this.loading(true);

            return new Promise(resolve => {
                setTimeout(
                    () => {
                        this.data(JSON.parse(featureAnalysesList).analyses);
                        this.loading(false);
                    },
                    2000
                );
            });
        }

        selectAnalysis(data) {
            this.selectedAnalysis(data);
        }
    }

    return commonUtils.build('feature-analyses-browser', FeatureAnalysesBrowser, view);
});
