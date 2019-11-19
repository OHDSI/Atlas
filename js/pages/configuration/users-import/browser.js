define([
		'knockout',
		'appConfig',
		'text!./browser.html',
		'services/AuthAPI',
		'./services/PermissionService',
		'utils/AutoBind',
		'components/Component',
		'utils/CommonUtils',
		'utils/DatatableUtils',
		'./services/JobService',
		'./const',
		'./utils',
		'less!./browser.less',
], function(
		ko,
		config,
		view,
		authApi,
		permissionService,
		AutoBind,
		Component,
		commonUtils,
		datatableUtils,
		jobService,
		Const,
		Utils,
) {
		class UserImportBrowser extends AutoBind(Component) {

			constructor(params) {
				super();
				this.config = config;
				this.isAuthenticated = authApi.isAuthenticated;
				this.canImport = ko.pureComputed(() => authApi.isPermittedImportUsers());
				this.canCreate = ko.pureComputed(() => permissionService.isPermittedCreate());
				this.loading = ko.observable();
				this.data = ko.observableArray();

				this.gridColumns = [
					{
						title: 'Provider',
						data: 'providerType',
						className: this.classes('tbl-col', 'provider'),
						render: datatableUtils.getLinkFormatter(d => ({
							link: '#/import/job/' + d.id,
							label: Const.AuthenticationProviders.find(p => p.value === d.providerType).label,
						})),
					},
					{
						title: 'Enabled',
						data: 'enabled',
						className: this.classes('tbl-col', 'enabled'),
						render: data => data ? 'Yes' : 'No',
					},
					{
						title: 'Start date',
						className: this.classes('tbl-col', 'start-date'),
						render: datatableUtils.getDateFieldFormatter('startDate'),
					},
					{
						title: 'Execute',
						data: 'frequency',
						className: this.classes('tbl-col', 'frequency'),
						render: Utils.ExecuteRender,
					},
					{
						title: 'Ends',
						className: this.classes('tbl-col', 'ends'),
						render: Utils.EndsRender,
					},
					{
						title: 'Last executed',
						className: this.classes('tbl-col', 'last-executed'),
						render: datatableUtils.getDateFieldFormatter('lastExecuted', '-'),
					},
					{
						title: 'Next execution',
						className: this.classes('tbl0col', 'next-execution'),
						render: datatableUtils.getDateFieldFormatter('nextExecution', '-'),
					},
				];
				this.gridOptions = {
					Facets: [
						{
							caption: 'Provider',
							'binding': (o) => o.providerType,
						},
						{
							'caption': 'Start date',
							'binding': (o) => datatableUtils.getFacetForDate(o.startDate)
						},
					]
				};

				permissionService.isPermittedList() && this.loadJobs();
			}

			loadJobs() {
				this.loading(true);
				jobService.listJobs()
					.then(res => this.data(res))
					.finally(() => this.loading(false));
			}

			importNow() {
				commonUtils.routeTo('/import/wizard');
			}

			newScheduledImport() {
				commonUtils.routeTo('/import/job/0');
			}
		}

		return commonUtils.build("user-import-browser", UserImportBrowser, view);
});