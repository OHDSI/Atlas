define([
	'knockout',
	'text!./conceptsetInclusionCount.html',
	'providers/Component',
	'utils/CommonUtils',
	'services/ConceptSet',
], function(
	ko,
	view,
	Component,
	commonUtils,
	conceptSetApi,
){

	class ConceptSetInclusionCount extends Component {

		constructor(params) {
			super(params);
			this.countLoading = ko.observable();
			this.inclusionCount = ko.observable(0);

			this.conceptSetExpression = params.conceptSetExpression || ko.observableArray();

			this.getInclusionCount = this.getInclusionCount.bind(this);
			this.conceptSetExpressionSub = ko.pureComputed(() => ko.toJSON(this.conceptSetExpression)).subscribe(this.getInclusionCount);
			this.getInclusionCount();
		}

		getInclusionCount() {
			this.countLoading(true);
			conceptSetApi.getInclusionCount(this.conceptSetExpression())
				.then(({data}) => this.inclusionCount(data))
				.finally(() => this.countLoading(false));
		}

		dispose() {
			this.conceptSetExpressionSub.dispose();
		}

	}

	commonUtils.build('conceptset-inclusion-count', ConceptSetInclusionCount, view);
});