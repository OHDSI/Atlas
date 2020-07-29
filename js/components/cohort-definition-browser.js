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
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;
			this.options = {
				Facets: [
					{
						'caption': ko.i18n('facets.caption.lastModified', 'Last Modified'),
						'binding': function (o) {
							const createDate = new Date(o.createdDate);
							const modDate = new Date(o.modifiedDate);
							const dateForCompare = (createDate > modDate) ? createDate : modDate;
							return datatableUtils.getFacetForDate(dateForCompare);
						}
					},
					{
						'caption': ko.i18n('facets.caption.author', 'Author'),
						'binding': function (o) {
							return o.createdBy;
						}
					},
				],
			};

			this.columns = [
				...this.columns,
				{
					title: ko.i18n('columns.id', 'Id'),
					className: 'id-column',
					data: 'id'
				},
				{
					title: ko.i18n('columns.name', 'Name'),
					render: datatableUtils.getLinkFormatter(d => ({ label: d['name'], linkish: !this.multiChoice })),
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
				},
			];
		}

		action(callback) {
			const isConceptSetDirty = this.currentConceptSet() && this.currentConceptSetDirtyFlag().isDirty();
			if (isConceptSetDirty) {
				if (confirm(ko.i18n('components.cohortDefinitionBrowser.confirmMessage', 'Concept set changes are not saved. Would you like to continue?')())) {
					callback();
				}
			} else {
				callback();
			}
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
