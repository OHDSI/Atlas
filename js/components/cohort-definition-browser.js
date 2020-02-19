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
				Facets: [{
						'caption': ko.i18n('components.cohort-definition-browser.facets.lastModified', 'Last Modified'),
						'binding': function (o) {
							var createDate = new Date(o.createdDate);
							var modDate = new Date(o.modifiedDate);
							var dateForCompare = (createDate > modDate) ? createDate : modDate;
							return datatableUtils.getFacetForDate(dateForCompare);
						}
					},
					{
						'caption': ko.i18n('components.cohort-definition-browser.facets.author', 'Author'),
						'binding': function (o) {
							return o.createdBy;
						}
					}
				],
			};

			this.language = ko.i18n('datatable.language');

			this.columns = [{
					title: ko.i18n('components.cohort-definition-browser.table.columns.id', 'Id'),
					className: 'id-column',
					data: 'id'
				},
				{
					title: ko.i18n('components.cohort-definition-browser.table.columns.name', 'Name'),
					render: datatableUtils.getLinkFormatter(d => ({
						label: d['name'],
						linkish: true,
					})),
				},
				{
					title: ko.i18n('components.cohort-definition-browser.table.columns.created', 'Created'),
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('createdDate'),
				},
				{
					title: ko.i18n('components.cohort-definition-browser.table.columns.updated', 'Updated'),
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('modifiedDate'),
				},
				{
					title: ko.i18n('components.cohort-definition-browser.table.columns.author', 'Author'),
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
