define([
    'knockout',
    'text!./incidence-rate-browser.html',
    'appConfig',
    'atlas-state',
    'components/entity-browser',
    'services/AuthAPI',
    'utils/CommonUtils',
    'services/IRAnalysis',
    'utils/DatatableUtils',
    'faceted-datatable',
], function (
    ko,
    view,
    config,
    sharedState,
    EntityBrowser,
    authApi,
    commonUtils,
    IRAnalysisService,
    datatableUtils,
) {

    class IncidenceRateBrowser extends EntityBrowser {
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
            IRAnalysisService
                .getAnalysisList()
                .then(({ data }) => {
                    const analysisList = ko.unwrap(this.myDesignsOnly)
                        ? data.filter(a => a.hasWriteAccess || (a.createdBy && authApi.subject() === a.createdBy.login))
                        : data;
                    datatableUtils.coalesceField(analysisList, 'modifiedDate', 'createdDate');
                    datatableUtils.addTagGroupsToFacets(analysisList, this.options.Facets);
                    datatableUtils.addTagGroupsToColumns(analysisList, this.columns);
                    this.data(analysisList.map(item => ({ selected: ko.observable(this.selectedDataIds.includes(item.id)), ...item })));
                    this.isLoading(false);
                });
        }

    }

    return commonUtils.build('incidence-rate-browser', IncidenceRateBrowser, view);
});
