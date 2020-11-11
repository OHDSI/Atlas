define([
	'knockout', 
	'text!./outcome-model-args-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'utils/DataTypeConverterUtils',
	'databindings',
	'cyclops',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	constants,
	dataTypeConverterUtils
) {
	class OutcomeModelArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.outcomeModelArgs = params.outcomeModelArgs;
			this.matchStratifySelection = params.matchStratifySelection;
			this.options = constants.options;
			this.isEditPermitted = params.isEditPermitted;
			this.subscriptions = params.subscriptions;
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.excludeCovariateIds = ko.observable(this.outcomeModelArgs.excludeCovariateIds() && this.outcomeModelArgs.excludeCovariateIds().length > 0 ? this.outcomeModelArgs.excludeCovariateIds().join() : '');
			this.includeCovariateIds = ko.observable(this.outcomeModelArgs.includeCovariateIds() && this.outcomeModelArgs.includeCovariateIds().length > 0 ? this.outcomeModelArgs.includeCovariateIds().join() : '');
			this.interactionCovariateIds = ko.observable(this.outcomeModelArgs.interactionCovariateIds() && this.outcomeModelArgs.interactionCovariateIds().length > 0 ? this.outcomeModelArgs.interactionCovariateIds().join() : '');
			this.useRegularization = ko.observable(constants.isUsingRegularization(this.outcomeModelArgs.prior) ? true : false);

			this.subscriptions.push(this.includeCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.includeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.excludeCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.excludeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.interactionCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.interactionCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.useRegularization.subscribe(newValue => {
				constants.setRegularization(newValue, this.outcomeModelArgs.prior);
			}));			
		}

		toggleControlDisplay() {
			this.showControlDisplay(!this.showControlDisplay());
		}
	
		togglePriorDisplay() {
			this.showPriorDisplay(!this.showPriorDisplay());
		}
	}

	return commonUtils.build('outcome-model-args-editor', OutcomeModelArgsEditor, view);
});