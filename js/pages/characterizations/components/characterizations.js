define([
    'knockout',
    'atlas-state',
    'text!./characterizations.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    './tabbed-grid',
    'less!./characterizations.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    datatableUtils,
    constants,
) {
    class Characterizations extends Component {
        constructor(params) {
            super();

            this.gridTab = constants.characterizationsTab;

            this.data = ko.observableArray([
                {
                    name: 'Simple CC',
                    createdBy: 'Pavel Grafkin',
                    createdAt: '2018-07-07',
                    updatedAt: '2018-07-09',
                },
                {
                    name: 'Cost & Util CC',
                    createdBy: 'Gowtham Rao',
                    createdAt: '2018-06-10',
                    updatedAt: '2018-07-08',
                }
            ]);

            this.gridColumns = [
                {
                    title: 'Name',
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
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
                    data: 'createdBy',
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
                        'binding': o => o.createdBy,
                    },
                ]
            };
        }
    }

    return commonUtils.build('characterizations', Characterizations, view);
});
