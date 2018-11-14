define([
	'knockout',
	'text!./explore-prevalence.html',
	'components/Component',
	'utils/CommonUtils',
], function(
	ko,
	view,
	Component,
	commonUtils,
){

	class ExplorePrevalence extends Component {

		constructor(params) {
			super(params);
			this.tableColumns = [
				{ title: 'Relationship type', render: this.renderRelationship },
				{ title: 'Distance', data: 'distance' },
				{ title: 'Concept name', data: 'covariate_name' },
				{ title: 'Count', data: 'count' },
				{ title: 'Pct', },
			];
			this.data = ko.observableArray();
		}

		renderRelationship(data, type, row) {
			return 'Ancestor';
		}

	}

	commonUtils.build('explore-prevalence', ExplorePrevalence, view);

});