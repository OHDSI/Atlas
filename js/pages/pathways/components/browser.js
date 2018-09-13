define([
	'knockout',
	'text!./browser.html',
	'../const',
	'appConfig',
	'../PathwayService',
	'webapi/AuthAPI',
	'providers/Component',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'less!./browser.less'
], function (
	ko,
	view,
	constants,
	config,
	PathwayService,
	authApi,
	Component,
	commonUtils,
	datatableUtils
) {
	class PathwaysBrowser extends Component {
    constructor(params) {
      super(params);      
      this.loading = ko.observable(false);
      this.config = config;
      this.analysisList = ko.observableArray();
      this.isAuthenticated = authApi.isAuthenticated;
      this.canRead = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedReadIRs()) || !config.userAuthenticationEnabled;
      });
      this.canCreate = ko.pureComputed(() => {
        return (config.userAuthenticationEnabled && this.isAuthenticated() && authApi.isPermittedCreateIR()) || !config.userAuthenticationEnabled;
      });
      
      // startup actions
      this.refresh();
    }

		refresh() {
			this.loading(true);
			PathwayService
				.list()
				.then(res => {
					this.analysisList(res.content);
					this.loading(false);
				});
		}

		newAnalysis() {
			commonUtils.routeTo('/pathways/0/design');
		}
		
		onAnalysisSelected(d) {
     commonUtils.routeTo(`/pathways/${d.id}/design`);
    };
		
		get gridColumns()  {
			return [{
					title: 'Name',
					data: 'name',
					className: this.classes('tbl-col', 'name'),
					render: datatableUtils.getLinkFormatter(d => ({
						link: '#/pathways/' + d.id,
						label: d['name']
					}))
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
					data: (d) => (d.createdBy && d.createdBy.login) || "",
					className: this.classes('tbl-col', 'author'),
				}
			];
		}
			
		get gridOptions() {
			return {
				Facets: [{
						'caption': 'Created',
						'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
					},
					{
						'caption': 'Updated',
						'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
					},
					{
						'caption': 'Author',
						'binding': (o) => (o.createdBy && o.createdBy.login) || "",
					},
				]
			};
		}
	}

	return commonUtils.build('pathways-browser', PathwaysBrowser, view);
});
