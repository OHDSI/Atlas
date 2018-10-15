define([
		'knockout',
		'appConfig',
		'text!./browser.html',
		'webapi/AuthAPI',
		'providers/AutoBind',
		'providers/Component',
		'utils/CommonUtils',
		'utils/DatatableUtils',
		'./services/JobService',
		'./const',
		'less!./browser.less',
], function(
		ko,
		config,
		view,
		authApi,
		AutoBind,
		Component,
		commonUtils,
		datatableUtils,
		jobService,
		Const,
) {
		class UserImportBrowser extends AutoBind(Component) {

			constructor(params) {
				super();
				this.config = config;
				this.isAuthenticated = authApi.isAuthenticated;
				this.canImport = ko.pureComputed(() => this.isAuthenticated() && authApi.isPermittedImportUsers());
				this.loading = ko.observable();
				this.data = ko.observableArray();

				this.gridColumns = [
					{
						title: 'Provider',
						data: 'providerType',
						className: this.classes('tbl-col', 'name'),
						render: datatableUtils.getLinkFormatter(d => ({
							link: '#/import/job/' + d.id,
							label: Const.AuthenticationProviders.find(p => p.value === d.providerType).label,
						})),
					},
					{
						title: 'Enabled',
						data: 'enabled',
						className: this.classes('tbl-col', 'created'),
					},
					{
						title: 'Start date',
						className: this.classes('tbl-col', 'updated'),
						type: 'date',
						render: datatableUtils.getDateFieldFormatter('startDate'),
					},
				];
				this.gridOptions = {
					Facets: [
						{
							'caption': 'Start date',
							'binding': (o) => datatableUtils.getFacetForDate(o.startDate)
						},
					]
				};

				this.canImport() && this.loadJobs();
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