define([
	'knockout', 
	'text!./PositiveControlSythesisSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
	'cyclops',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class PositiveControlSythesisSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.settings = params.settings;
            this.options = options.positiveControlSynthesisArgs;
			this.showCovariateSelector = ko.observable(false);
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
		}

		toggleControlDisplay() {
			this.showControlDisplay(!this.showControlDisplay());
		}

		togglePriorDisplay() {
			this.showPriorDisplay(!this.showPriorDisplay());
		}
	}

	return commonUtils.build('positive-control-synthesis-settings-editor', PositiveControlSythesisSettingsEditor, view);
});