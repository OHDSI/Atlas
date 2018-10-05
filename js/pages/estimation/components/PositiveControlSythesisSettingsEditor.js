define([
	'knockout', 
	'text!./PositiveControlSythesisSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'utils/DataTypeConverterUtils',
	'databindings',
	'cyclops',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
	dataTypeConverterUtils
) {
	class PositiveControlSythesisSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.settings = params.settings;
            this.options = options.positiveControlSynthesisArgs;
			this.showCovariateSelector = ko.observable(false);
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.effectSizes = ko.observable(this.settings().effectSizes() && this.settings().effectSizes().length > 0 ? this.settings().effectSizes().join() : '');

			this.effectSizes.subscribe(newValue => {
				this.settings().effectSizes(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});
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