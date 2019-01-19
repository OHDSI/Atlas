define([
	'knockout', 
	'text!./ada-boost-settings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
	dataTypeConverterUtils,
) {
	class AdaBoostSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.learningRate = {
				name: 'learningRate',
				value: ko.observable(this.modelSettings.learningRate() && this.modelSettings.learningRate().length > 0 ? this.modelSettings.learningRate().join() : ''),
			};
			this.nEstimators = {
				name: 'nEstimators',
				value: ko.observable(this.modelSettings.nEstimators() && this.modelSettings.nEstimators().length > 0 ? this.modelSettings.nEstimators().join() : ''),
			};

			this.subscriptions.push(this.learningRate.value.subscribe(newValue => {
				this.modelSettings.learningRate(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.nEstimators.value.subscribe(newValue => {
				this.modelSettings.nEstimators(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
		}
	}

	return commonUtils.build('ada-boost-settings', AdaBoostSettings, view);
});