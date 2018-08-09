define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'text!./characterizations-list.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    '../tabbed-grid',
    'less!./characterizations-list.less',
], function (
    ko,
    CharacterizationService,
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

            this.loading = ko.observable(false);
            this.data = ko.observableArray();

            this.gridColumns = [
                {
                    title: 'Name',
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
                    render: function (s, p, d) {
                        return '<a href="#/cc/characterizations/' + d.id + '">' + d.name + '</a>';
                    },
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
            CharacterizationService
                .loadCharacterizationList()
                .then(res => {
                    this.data(res.characterizations);
                    this.loading(false);
                });
        }
    }

    return commonUtils.build('characterizations-list', Characterizations, view);
});
