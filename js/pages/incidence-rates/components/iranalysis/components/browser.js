define([
	'knockout',
	'text!./browser.html',
	'components/Component',
	'utils/CommonUtils',
	'services/MomentAPI',
	'faceted-datatable'
], function (
	ko,
	view,
	Component,
	commonUtils,
	momentApi
) {
	
	class IRAnalysisBrowserModel extends Component {
		constructor(params) {
			super(params);
			this.analysisList = params.analysisList;
			
			this.options = {
				Facets: [
					{
						'caption': 'Last Modified',
						'binding': function (o) {
							var daysSinceModification = (new Date().getTime() - new Date(o.modifiedDate || o.createdDate).getTime()) / 1000 / 60 / 60 / 24;
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

			this.columns = [
				{
					title: 'Id',
					data: 'id'
				},
				{
					title: 'Name',
					render: (s, p, d) => {
						return '<span class="linkish">' + d.name + '</span>';
					}
				},
				{
					title: 'Created',
					type: 'datetime-formatted',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.createdDate);
					}
				},
				{
					title: 'Updated',
					type: 'datetime-formatted',
					render: function (s, p, d) {
						return momentApi.formatDateTimeUTC(d.modifiedDate);
					}
				},
				{
					title: 'Author',
					data: 'createdBy'
				}
			];

			this.rowClick = this.rowClick.bind(this);
		}
		
		rowClick (d) {
			this.selected(d.id);
		}
	}

	return commonUtils.build('ir-analysis-browser', IRAnalysisBrowserModel, view);
});