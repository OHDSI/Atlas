define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
	'atlas-state',
	'components/entity-browser',
	'utils/CommonUtils',
	'services/http',
	'utils/DatatableUtils',
	'utils/Renderers',
	'faceted-datatable',
	'less!./cohort-definition-browser.less',
], function (
	ko,
	view,
	config,
	sharedState,
	EntityBrowser,
	commonUtils,
	httpService,
	datatableUtils,
	renderers,
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
						'caption': 'Last Modified',
						'binding': function (o) {
							const createDate = new Date(o.createdDate);
							const modDate = new Date(o.modifiedDate);
							const dateForCompare = (createDate > modDate) ? createDate : modDate;
							const daysSinceModification = (new Date().getTime() - dateForCompare.getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
								return 'This Week';
							} else if (daysSinceModification < 14) {
								return 'Last Week';
							}
							return '2+ Weeks Ago';
						}
					},
					{
						'caption': 'Author',
						'binding': function (o) {
							return o.createdBy;
						}
					},
				],
			};

			this.columns = [
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

			if (!!this.multiChoice) {
				this.columns = [
					{
						data: 'selected',
						class: this.classes({extra: 'text-center'}),
						render: () => renderers.renderCheckbox('selected'),
						searchable: false,
						orderable: false,
					},
					...this.columns,
				];
			}
		}

		action(callback) {
			const isConceptSetDirty = this.currentConceptSet() && this.currentConceptSetDirtyFlag().isDirty();
			if (isConceptSetDirty) {
				if (confirm('Concept set changes are not saved. Would you like to continue?')) {
					callback();
				}
			} else {
				callback();
			}
		}

		async loadData() {
			try {
				this.isLoading(true);
				const { data } = await httpService.doGet(`${config.api.url}cohortdefinition`);
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
