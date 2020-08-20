define([
	'knockout', 
	'text!./positive-control-sythesis-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'const',
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
	estimationConstants,
	dataTypeConverterUtils
) {
	class PositiveControlSythesisSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.settings = params.settings;
			this.constants = constants;
			this.options = estimationConstants.options.positiveControlSynthesisArgs;
			this.subscriptions = params.subscriptions;
			this.showCovariateSelector = ko.observable(false);
			this.showAdditionalSettings = ko.observable(false);
			this.effectSizes = ko.observable(this.settings().effectSizes() && this.settings().effectSizes().length > 0 ? this.settings().effectSizes().join() : '');
			this.isEditPermitted = params.isEditPermitted;

			this.subscriptions.push(this.effectSizes.subscribe(newValue => {
				this.settings().effectSizes(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
		}

		toggleAdditionalSettings() {
			this.showAdditionalSettings(!this.showAdditionalSettings());
		}
	}

	return commonUtils.build('positive-control-synthesis-settings-editor', PositiveControlSythesisSettingsEditor, view);
});