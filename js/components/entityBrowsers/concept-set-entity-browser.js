define([
    'knockout',
    'text!./concept-set-entity-browser.html',
    'appConfig',
    'atlas-state',
    'appConfig',
    'components/entity-browser',
    'services/AuthAPI',
    'services/VocabularyProvider',
    'utils/CommonUtils',
    'pages/characterizations/services/CharacterizationService',
    'utils/DatatableUtils',
    'faceted-datatable',
], function (
    ko,
    view,
    config,
    sharedState,
    appConfig,
    EntityBrowser,
    authApi,
    VocabularyProvider,
    commonUtils,
    CharacterizationService,
    datatableUtils,
) {

    class ConceptSetEntityBrowser extends EntityBrowser {
        constructor(params) {
            super(params);
            this.showModal = params.showModal;
            this.myDesignsOnly = params.myDesignsOnly || false;
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
                    render: this.renderLink ?
                        datatableUtils.getLinkFormatter(d => ({ label: d['name'], linkish: !this.multiChoice })) :
                        (s,p,d) => `${d.name}`
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

            VocabularyProvider.getConceptSetList(appConfig.api.url)
                .done((results) => {
                    const list = ko.unwrap(this.myDesignsOnly)
                        ? results.filter(a => a.hasWriteAccess || (a.createdBy && authApi.subject() === a.createdBy.login))
                        : results;
                    datatableUtils.coalesceField(list, 'modifiedDate', 'createdDate');
                    datatableUtils.addTagGroupsToFacets(list, this.options.Facets);
                    datatableUtils.addTagGroupsToColumns(list, this.columns);
                    this.data(list.map(item => ({ selected: ko.observable(this.selectedDataIds.includes(item.id)), ...item })));
                    this.isLoading(false);
                });
        }

    }

    return commonUtils.build('concept-set-entity-browser', ConceptSetEntityBrowser, view);
});
