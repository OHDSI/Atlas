define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
	'atlas-state',
	'services/AuthAPI',
	'services/MomentAPI',
	'components/Component',
	'utils/CommonUtils',
	'services/http',
	'utils/DatatableUtils',
	'faceted-datatable',
], function (
	ko,
	view,
	config,
	sharedState,
	authApi,
	momentApi,
	Component,
	commonUtils,
	httpService,
	datatableUtils,
) {
	class CohortDefinitionBrowser extends Component {
		constructor(params) {
			super(params);
			this.reference = ko.observableArray();
			this.selected = params.cohortDefinitionSelected;
			this.loading = ko.observable(false);
			this.config = config;
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetDirtyFlag = sharedState.ConceptSet.dirtyFlag;

			this.loading(true);

			httpService.doGet(`${config.api.url}cohortdefinition`)
				.then(({ data }) => {
					datatableUtils.coalesceField(data, 'modifiedDate', 'createdDate');
					this.reference(data);
				})
				.finally(() => { this.loading(false) });

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

			this.columns = [{
					title: 'Id',
					className: 'id-column',
					data: 'id'
				},
				{
					title: 'Name',
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['name'],
						linkish: true,
					})),
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
				}
			];

			this.rowClick = this.rowClick.bind(this);
		}

		rowClick(data) {
			this.action(() => this.selected(data));
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
	}

	return commonUtils.build('cohort-definition-browser', CohortDefinitionBrowser, view);
});
