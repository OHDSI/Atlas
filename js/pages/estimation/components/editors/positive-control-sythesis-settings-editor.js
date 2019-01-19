define([
	'knockout', 
	'text!./positive-control-sythesis-settings-editor.html',	
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
	class PositiveControlSythesisSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.settings = params.settings;
			this.options = constants.options.positiveControlSynthesisArgs;
			this.subscriptions = params.subscriptions;
			this.showCovariateSelector = ko.observable(false);
			this.showControlDisplay = ko.observable(false);
			this.showPriorDisplay = ko.observable(false);
			this.effectSizes = ko.observable(this.settings().effectSizes() && this.settings().effectSizes().length > 0 ? this.settings().effectSizes().join() : '');

			this.subscriptions.push(this.effectSizes.subscribe(newValue => {
				this.settings().effectSizes(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
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