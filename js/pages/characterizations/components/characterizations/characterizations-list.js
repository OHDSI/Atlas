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

            this.gridColumns = ko.observableArray([
                {
                    title: ko.i18n('columns.id', 'Id'),
                    data: 'id'
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name',
                    className: this.classes('tbl-col', 'name'),
                    render: datatableUtils.getLinkFormatter(d => ({
                        link: '#/cc/characterizations/' + d.id,
                        label: d['name']
                    })),
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    className: this.classes('tbl-col', 'created'),
                    render: datatableUtils.getDateFieldFormatter(),
                },
                {
                    title: ko.i18n('columns.updated', 'Updated'),
                    className: this.classes('tbl-col', 'updated'),
                    render: datatableUtils.getDateFieldFormatter('modifiedDate'),
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    className: this.classes('tbl-col', 'author'),
                    render: datatableUtils.getCreatedByFormatter(),
                },

            ]);
            this.gridOptions = {
                Facets: [
                    {
                        'caption': ko.i18n('facets.caption.created', 'Created'),
                        'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
                    },
                    {
                        'caption': ko.i18n('facets.caption.updated', 'Updated'),
                        'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
                    },
                    {
                        'caption': ko.i18n('facets.caption.author', 'Author'),
                        'binding': datatableUtils.getFacetForCreatedBy,
                    },
                    {
                        'caption': ko.i18n('facets.caption.designs', 'Designs'),
                        'binding': datatableUtils.getFacetForDesign,
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
                    datatableUtils.coalesceField(res.content, 'modifiedDate', 'createdDate');
                    datatableUtils.addTagGroupsToFacets(res.content, this.gridOptions.Facets);
                    datatableUtils.addTagGroupsToColumns(res.content, this.gridColumns);
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
