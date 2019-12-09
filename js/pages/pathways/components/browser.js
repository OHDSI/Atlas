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

		get datatableLanguage() {
			return ko.i18n('datatable.language');
		}

		get gridColumns() {
			const columns = ko.i18n('pathways.browser.table.columns');
			return ko.computed(() => [
				{
					title: ko.i18n('id', 'Id', columns),
					data: 'id'
				},
				{
					title: ko.i18n('name', 'Name', columns),
					data: 'name',
					className: this.classes('tbl-col', 'name'),
					render: datatableUtils.getLinkFormatter(d => ({
						link: '#/pathways/' + d.id,
						label: d['name']
					}))
				},
				{
					title: ko.i18n('created', 'Created', columns),
					className: this.classes('tbl-col', 'created'),
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: ko.i18n('updated', 'Updated', columns),
					className: this.classes('tbl-col', 'updated'),
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: ko.i18n('author', 'Author', columns),
                    render: datatableUtils.getCreatedByFormatter(),
					className: this.classes('tbl-col', 'author'),
				}
			]);
		}

		get gridOptions() {
			const facets = ko.i18n('pathways.browser.grid.facets');
			return ko.observable({
				Facets: [{
					'caption': ko.i18n('created', 'Created', facets),
					'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
				},
					{
						'caption': ko.i18n('updated', 'Updated', facets),
						'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
					},
					{
						'caption': ko.i18n('author', 'Author', facets),
						'binding': (o) => (o.createdBy && o.createdBy.login) || "",
					},
				]
			});
		}
	}

	return commonUtils.build('pathways-browser', PathwaysBrowser, view);
});
