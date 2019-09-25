define([
	'knockout',
	'text!./browser.html',
	'../const',
	'appConfig',
	'../PathwayService',
	'../PermissionService',
	'services/AuthAPI',
	'pages/Page',
	'utils/CommonUtils',
	'utils/DatatableUtils',
	'less!./browser.less'
], function (
	ko,
	view,
	constants,
	config,
	PathwayService,
	PermissionService,
	authApi,
	Page,
	commonUtils,
	datatableUtils
) {
	class PathwaysBrowser extends Page {
		constructor(params) {
			super(params);
			this.loading = ko.observable(false);
			this.config = config;
			this.analysisList = ko.observableArray();

			this.canList = PermissionService.isPermittedList;
			this.canCreate = PermissionService.isPermittedCreate;
		}

		onRouterParamsChanged() {
			this.canList() && this.loadData();
		}

		async loadData() {
			this.loading(true);
			const analysisList = await PathwayService.list();
			datatableUtils.coalesceField(analysisList.content, 'modifiedDate', 'createdDate');
			this.analysisList(analysisList.content);
			this.loading(false);
		}

		newAnalysis() {
			commonUtils.routeTo(commonUtils.getPathwaysUrl(0, 'design'));
		}

		get gridColumns() {
			return [
				{
					title: 'Id',
					data: 'id'
				},
				{
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
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: 'Updated',
					className: this.classes('tbl-col', 'updated'),
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: 'Author',
                    render: datatableUtils.getCreatedByFormatter(),
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
