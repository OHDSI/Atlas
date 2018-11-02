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
			if (this.canList) {
				this.ajax = PathwayService.list;
			}
		}

		newAnalysis() {
			commonUtils.routeTo(commonUtils.getPathwaysUrl(0, 'design'));
		}

		get gridColumns() {
			return [
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
					data: 'createdDate',
					className: this.classes('tbl-col', 'created'),
					type: 'date',
					render: datatableUtils.getDateFieldFormatter(),
				},
				{
					title: 'Updated',
					data: 'modifiedDate',
					className: this.classes('tbl-col', 'updated'),
					type: 'date',
					render: datatableUtils.getDateFieldFormatter(),
				},
				{
					title: 'Author',
					data: 'createdBy',
					className: this.classes('tbl-col', 'author'),
					render: (s, p, d) => (d.createdBy !== null ? d.createdBy.login : 'anonymous'),
				}
			];
		}

		get gridOptions() {
			return {
				entityName: 'pathway_analysis',
			};
		}
	}

	return commonUtils.build('pathways-browser', PathwaysBrowser, view);
});
