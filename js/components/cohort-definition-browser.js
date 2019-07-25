define([
	'knockout',
	'text!./cohort-definition-browser.html',
	'appConfig',
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

			this.loading(true);

			httpService.doGet(`${config.api.url}cohortdefinition`)
				.then(({ data }) => {
					let defList = data.map(d => {
						return {
							...d,
							...{
								createdTimestamp: d.createdDate && new Date(d.createdDate).getTime(),
								modifiedTimestamp: d.modifiedDate && new Date(d.modifiedDate || d.createdDate).getTime()
							}
						};
					});
					datatableUtils.coalesceField(defList, 'modifiedTimestamp', 'createdTimestamp');
					this.reference(defList);
				})
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
					render: datatableUtils.getDateFieldFormatter('createdTimestamp'),
				},
				{
					title: 'Updated',
					className: 'date-column',
					render: datatableUtils.getDateFieldFormatter('modifiedTimestamp'),
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
			this.selected(data);
		}
	}

	return commonUtils.build('cohort-definition-browser', CohortDefinitionBrowser, view);
});
