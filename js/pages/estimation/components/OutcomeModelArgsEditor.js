define([
	'knockout', 
	'text!./OutcomeModelArgsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'utils/DataTypeConverterUtils',
	'databindings',
	'cyclops',
	'less!../cca-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
	dataTypeConverterUtils
) {
	class OutcomeModelArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.outcomeModelArgs = params.outcomeModelArgs;
			this.matchStratifySelection = params.matchStratifySelection;
            this.options = options;
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.showCovariateDisplay = ko.observable(false);
			this.excludeCovariateIds = ko.observable(this.outcomeModelArgs.excludeCovariateIds() && this.outcomeModelArgs.excludeCovariateIds().length > 0 ? this.outcomeModelArgs.excludeCovariateIds().join() : '');
			this.includeCovariateIds = ko.observable(this.outcomeModelArgs.includeCovariateIds() && this.outcomeModelArgs.includeCovariateIds().length > 0 ? this.outcomeModelArgs.includeCovariateIds().join() : '');
			this.interactionCovariateIds = ko.observable(this.outcomeModelArgs.interactionCovariateIds() && this.outcomeModelArgs.interactionCovariateIds().length > 0 ? this.outcomeModelArgs.interactionCovariateIds().join() : '');

			this.includeCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.includeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.excludeCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.excludeCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.interactionCovariateIds.subscribe(newValue => {
				this.outcomeModelArgs.interactionCovariateIds(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.stratified = ko.pureComputed(() => {
				var stratified = (this.matchStratifySelection() !== "none");
				this.outcomeModelArgs.stratified(stratified);
				return stratified; 
			});
		}

		toggleControlDisplay() {
			this.showControlDisplay(!this.showControlDisplay());
		}
	
		togglePriorDisplay() {
			this.showPriorDisplay(!this.showPriorDisplay());
		}

		toggleCovariateDisplay() {
			this.showCovariateDisplay(!this.showCovariateDisplay());
		}
	}

	return commonUtils.build('outcome-model-args-editor', OutcomeModelArgsEditor, view);
});