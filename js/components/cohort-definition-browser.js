define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
	'atlas-state',
	'components/entity-browser',
	'utils/CommonUtils',
	'services/CohortDefinition',
	'utils/DatatableUtils',
	'faceted-datatable',
], function (
	ko,
	view,
	config,
	sharedState,
	EntityBrowser,
	commonUtils,
	CohortDefinitionService,
	datatableUtils,
) {

	class CohortDefinitionBrowser extends EntityBrowser {
		constructor(params) {
			super(params);
			this.showModal = params.showModal;
			this.data = ko.observableArray();
			this.options = {
				Facets: [
					{
						'caption': 'Created',
						'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
					},
					{
						'caption': 'Updated',
						'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
					},
					{
						'caption': 'Author',
						'binding': datatableUtils.getFacetForCreatedBy,
					},
					{
						'caption': 'Designs',
						'binding': datatableUtils.getFacetForDesign,
					},
				]
			};

			this.columns = [
				...this.columns,
				{
					title: 'Id',
					className: 'id-column',
					data: 'id'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({ label: d['name'], linkish: !this.multiChoice })),
				},
				{
					title: 'Created',
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: 'Updated',
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: 'Author',
					className: 'author-column',
					render: datatableUtils.getCreatedByFormatter(),
				},
			];
		}

		async loadData() {
			try {
				this.isLoading(true);
				const data = await CohortDefinitionService.getCohortDefinitionList();
				datatableUtils.coalesceField(data, 'modifiedDate', 'createdDate')
				this.data(data.map(item => ({ selected: ko.observable(this.selectedDataIds.includes(item.id)), ...item })));
			} catch (err) {
				console.error(err);
			} finally {
				this.isLoading(false);
			}
		}

	}

	return commonUtils.build('cohort-definition-browser', CohortDefinitionBrowser, view);
});
