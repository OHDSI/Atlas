define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
	'webapi/AuthAPI',
	'webapi/MomentAPI',
	'providers/Component',
	'utils/CommonUtils',
	'services/http',
	'faceted-datatable',
], function (
	ko,
	view,
	config,
	authApi,
	momentApi,
	Component,
	commonUtils,
	httpService
) {
	class CohortDefinitionBrowser extends Component {
		constructor(params) {
			super(params);
			this.reference = ko.observableArray();
			this.selected = params.cohortDefinitionSelected;
			this.loading = ko.observable(false);
			this.config = config;

			this.loading(true);

			httpService.doGet(`${config.api.url}cohortdefinition`)
				.then(({ data }) => this.reference(data))
				.finally(() => { this.loading(false) });


			this.options = {
				Facets: [{
						'caption': 'Last Modified',
						'binding': function (o) {
							var createDate = new Date(o.createdDate);
							var modDate = new Date(o.modifiedDate);
							var dateForCompare = (createDate > modDate) ? createDate : modDate;
							var daysSinceModification = (new Date()
								.getTime() - dateForCompare.getTime()) / 1000 / 60 / 60 / 24;
							if (daysSinceModification < 7) {
								return 'This Week';
							} else if (daysSinceModification < 14) {
								return 'Last Week';
							} else {
								return '2+ Weeks Ago';
							}
						}
					},
					{
						'caption': 'Author',
						'binding': function (o) {
							return o.createdBy;
						}
					}
				]
			};

			this.columns = [{
					title: 'Id',
					data: 'id'
				},
				{
					title: 'Name',
					render: this.renderCohortDefinitionLink
				},
				{
					title: 'Created',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Updated',
					type: 'date',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];

			this.renderCohortDefinitionLink = this.renderCohortDefinitionLink.bind(this);
			this.rowClick = this.rowClick.bind(this);
		}
		
		renderCohortDefinitionLink (s, p, d) {
			return '<span class="linkish">' + d.name + '</span>';
		}

		rowClick (d) {
			this.selected(d.id);
		}
	}

	return commonUtils.build('cohort-definition-browser', CohortDefinitionBrowser, view);
});
