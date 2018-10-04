define([
	'knockout',
	'text!./conceptsetInclusionCount.html',
	'providers/Component',
	'utils/CommonUtils',
	'services/ConceptSetService',
], function(
	ko,
	view,
	Component,
	commonUtils,
	conceptSetApi,
){

	class ConceptSetInclusionCount extends Component{

		constructor(params) {
			super(params);
			this.countLoading = ko.observable();
			this.inclusionCount = ko.observable(0);

			this.conceptSetExpression = params.conceptSetExpression || ko.observableArray();

			this.getInclusionCount = this.getInclusionCount.bind(this);
			ko.computed(() => ko.toJSON(this.conceptSetExpression)).subscribe(this.getInclusionCount);
			this.getInclusionCount();
		}

		getInclusionCount() {
			this.countLoading(true);
			conceptSetApi.getInclusionCount(this.conceptSetExpression())
				.then(({data}) => this.inclusionCount(data))
				.finally(() => this.countLoading(false));
		}

	}

	commonUtils.build('conceptset-inclusion-count', ConceptSetInclusionCount, view);
});