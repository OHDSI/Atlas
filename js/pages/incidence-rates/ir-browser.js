define([
  'knockout',
  'text!./ir-browser.html',
  'appConfig',
  'services/IRAnalysis',
  'services/AuthAPI',
  'pages/Page',
  'utils/CommonUtils',
	'utils/DatatableUtils',
  './const',
  'components/ac-access-denied',
  'faceted-datatable',
  './components/iranalysis/main',
  'components/heading',
], function (
  ko,
  view,
  config,
  IRAnalysisService,
  authApi,
  Page,
  commonUtils,
  datatableUtils,
  constants
) {
  class IRBrowser extends Page {
    constructor(params) {
      super(params);
      this.loading = ko.observable(false);
      this.config = config;
      this.analysisList = ko.observableArray();
      this.isAuthenticated = authApi.isAuthenticated;
      this.canReadIRs = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadIRs()) || !config.userAuthenticationEnabled;
      });
      this.canCreateIR = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCreateIR()) || !config.userAuthenticationEnabled;
      });
      this.tableOptions = commonUtils.getTableOptions('L');

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
        {
          title: ko.i18n('columns.id', 'Id'),
          data: 'id'
        },
        {
          title: ko.i18n('columns.name', 'Name'),
          render: datatableUtils.getLinkFormatter(d => ({
            label: d['name'],
            linkish: true,
          })),
        },
        {
          title: ko.i18n('columns.created', 'Created'),
          render: datatableUtils.getDateFieldFormatter('createdDate'),
        },
        {
          title: ko.i18n('columns.updated', 'Updated'),
          render: datatableUtils.getDateFieldFormatter('modifiedDate'),
        },
        {
          title: ko.i18n('columns.author', 'Author'),
          render: datatableUtils.getCreatedByFormatter(),
        }
      ]);

      // startup actions
      if (this.isAuthenticated() && this.canReadIRs()) {
        this.refresh();
      }
    }

    refresh() {
      this.loading(true);
      IRAnalysisService
        .getAnalysisList()
        .then(({ data }) => {
          datatableUtils.coalesceField(data, 'modifiedDate', 'createdDate');
          datatableUtils.addTagGroupsToFacets(data, this.options.Facets);
          datatableUtils.addTagGroupsToColumns(data, this.columns)
          this.analysisList(data);
          this.loading(false);
        });
    };

    onAnalysisSelected(d) {
      commonUtils.routeTo(constants.apiPaths.analysis(d.id));
    };

    newAnalysis() {
      commonUtils.routeTo(constants.apiPaths.createAnalysis());
    };

  }

  return commonUtils.build('ir-browser', IRBrowser, view);
});