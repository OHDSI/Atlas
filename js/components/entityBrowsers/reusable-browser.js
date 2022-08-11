define([
    'knockout',
    'text!./reusable-browser.html',
    'appConfig',
    'atlas-state',
    'components/entity-browser',
    'services/AuthAPI',
    'services/ReusablesService',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'faceted-datatable',
], function (
    ko,
    view,
    config,
    sharedState,
    EntityBrowser,
    authApi,
    ReusablesService,
    commonUtils,
    datatableUtils,
) {

    class ReusableBrowser extends EntityBrowser {
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
            const reusablesList = await ReusablesService.list();
            const reusables = ko.unwrap(this.myDesignsOnly)
                ? reusablesList.content.filter(r => r.hasWriteAccess || (r.createdBy && authApi.subject() === r.createdBy.login))
                : reusablesList.content;
            datatableUtils.coalesceField(reusables, 'modifiedDate', 'createdDate');
            datatableUtils.addTagGroupsToFacets(reusables, this.options.Facets);
            datatableUtils.addTagGroupsToColumns(reusables, this.columns);
            this.data(reusables.map(item => ({ selected: ko.observable(this.selectedDataIds.includes(item.id)), ...item })));
            this.isLoading(false);
        }

    }

    return commonUtils.build('reusable-browser', ReusableBrowser, view);
});
