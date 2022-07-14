define([
    'knockout',
    'text!./characterization-browser.html',
    'appConfig',
    'atlas-state',
    'components/entity-browser',
    'utils/CommonUtils',
    'pages/characterizations/services/CharacterizationService',
    'utils/DatatableUtils',
    'faceted-datatable',
], function (
    ko,
    view,
    config,
    sharedState,
    EntityBrowser,
    commonUtils,
    CharacterizationService,
    datatableUtils,
) {

    class CharacterizationBrowser extends EntityBrowser {
        constructor(params) {
            super(params);
            this.showModal = params.showModal;
            this.data = ko.observableArray();
            const { pageLength, lengthMenu } = commonUtils.getTableOptions('M');
            this.pageLength = params.pageLength || pageLength;
            this.lengthMenu = params.lengthMenu || lengthMenu;

            this.options = {
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

            this.columns = ko.observableArray([
                ...this.columns,
                {
                    title: ko.i18n('columns.id', 'Id'),
                    className: 'id-column',
                    data: 'id'
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    render: datatableUtils.getLinkFormatter(d => ({ label: d['name'], linkish: !this.multiChoice })),
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    className: 'date-column',
                    render: datatableUtils.getDateFieldFormatter('createdDate'),
                },
                {
                    title: ko.i18n('columns.updated', 'Updated'),
                    className: 'date-column',
                    render: datatableUtils.getDateFieldFormatter('modifiedDate'),
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    className: 'author-column',
                    render: datatableUtils.getCreatedByFormatter(),
                }
            ]);
        }

        async loadData() {
            this.isLoading(true);
            CharacterizationService
                .loadCharacterizationList()
                .then(res => {
                    datatableUtils.coalesceField(res.content, 'modifiedDate', 'createdDate');
                    datatableUtils.addTagGroupsToFacets(res.content, this.options.Facets);
                    datatableUtils.addTagGroupsToColumns(res.content, this.columns);
                    this.data(res.content);
                    this.isLoading(false);
                });
        }

    }

    return commonUtils.build('characterization-browser', CharacterizationBrowser, view);
});
