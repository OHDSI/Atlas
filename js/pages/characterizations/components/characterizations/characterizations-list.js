define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'text!./characterizations-list.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'pages/characterizations/const',
    '../tabbed-grid',
    'less!./characterizations-list.less',
    'components/ac-access-denied',
], function (
    ko,
    CharacterizationService,
    PermissionService,
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

            this.isGetCCListPermitted = PermissionService.isPermittedGetCCList;
            this.isCreatePermitted = PermissionService.isPermittedCreateCC;

            const columnTitles = ko.i18n('cc.list.columns');
            this.gridColumns = [
                {
                    title: ko.i18n('id', 'Id', columnTitles),
                    data: 'id'
                },
                {
                    title: ko.i18n('name', 'Name', columnTitles),
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
                    render: datatableUtils.getLinkFormatter(d => ({
                        link: '#/cc/characterizations/' + d.id,
                        label: d['name']
                    })),
                },
                {
                    title: ko.i18n('created', 'Created', columnTitles),
                    className: this.classes('tbl-col', 'created'),
                    render: datatableUtils.getDateFieldFormatter(),
                },
                {
                    title: ko.i18n('updated', 'Updated', columnTitles),
                    className: this.classes('tbl-col', 'updated'),
                    render: datatableUtils.getDateFieldFormatter('updatedAt'),
                },
                {
                    title: ko.i18n('author', 'Author', columnTitles),
                    className: this.classes('tbl-col', 'author'),
                    render: datatableUtils.getCreatedByFormatter(),
                },

            ];
            const facetTitles = ko.i18n('cc.list.facets');
            this.gridOptions = {
                Facets: [
                    {
                        'caption': ko.i18n('created', 'Created', facetTitles),
                        'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
                    },
                    {
                        'caption': ko.i18n('updated', 'Updated', facetTitles),
                        'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
                    },
                    {
                        'caption': ko.i18n('author', 'Author', facetTitles),
                        'binding': datatableUtils.getFacetForCreatedBy,
                    },
                ]
            };

            this.isGetCCListPermitted() && this.loadData();
        }

        loadData() {
            this.loading(true);
            CharacterizationService
                .loadCharacterizationList()
                .then(res => {
                    datatableUtils.coalesceField(res.content, 'updatedAt', 'createdAt');
                    this.data(res.content);
                    this.loading(false);
                });
        }

        createCharacterization() {
            commonUtils.routeTo('/cc/characterizations/0');
        }
    }

    return commonUtils.build('characterizations-list', Characterizations, view);
});
