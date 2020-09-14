define([
	'knockout',
	'text!./conceptsetInclusionCount.html',
	'components/Component',
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
			this.expression = params.conceptSetExpression;

			this.conceptSetSubscriptionRateLimit = params.conceptSetSubscriptionRateLimit || 1000;

			this.getInclusionCount = this.getInclusionCount.bind(this);
			this.subscriptions.push(ko.pureComputed(() => ko.toJSON(this.expression())).extend({ rateLimit: { timeout: this.conceptSetSubscriptionRateLimit, method: "notifyWhenChangesStop" } }).subscribe(this.getInclusionCount));
			this.getInclusionCount();
		}

		getInclusionCount() {
			this.countLoading(true);
			conceptSetApi.getInclusionCount(this.expression())
				.then(({data}) => this.inclusionCount(Number.isInteger(data) ? data : 0))
				.finally(() => this.countLoading(false));
		}

	}

	commonUtils.build('conceptset-inclusion-count', ConceptSetInclusionCount, view);
});