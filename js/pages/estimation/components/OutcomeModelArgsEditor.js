define([
	'knockout', 
	'text!./OutcomeModelArgsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
	'cyclops',
	'less!../cca-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
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