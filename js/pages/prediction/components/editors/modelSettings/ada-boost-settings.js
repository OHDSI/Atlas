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
	const settings = {
		learningRate: 'learningRate',
		nEstimators: 'nEstimators'
	};

	class AdaBoostSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.learningRate = {
				name: settings.learningRate,
				value: this.modelSettings.learningRate,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.learningRate),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.learningRate),
			};
			this.nEstimators = {
				name: settings.nEstimators,
				value: this.modelSettings.nEstimators,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.nEstimators),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.nEstimators),
			};
		}
	}

	return commonUtils.build('ada-boost-settings', AdaBoostSettings, view);
});