define([
	'knockout', 
	'text!./gradient-boosting-machine-settings.html',	
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
		ntrees: 'ntrees',
		nthread: 'nthread',
		maxDepth: 'maxDepth',
		minRows: 'minRows',
		learnRate: 'learnRate'
	};
  
	class GradientBoostingMachineSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.ntrees = {
				name: settings.ntrees,
				value: this.modelSettings.ntrees,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.ntrees),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.ntrees),
			};
			this.nthread = {
				name: settings.nthread,
				value: this.modelSettings.nthread,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.nthread),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.nthread),
			};
			this.maxDepth = {
				name: settings.maxDepth,
				value: this.modelSettings.maxDepth,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.maxDepth),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.maxDepth),
			};
			this.minRows = {
				name: settings.minRows,
				value: this.modelSettings.minRows,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.minRows),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.minRows),
			};
			this.learnRate = {
				name: settings.learnRate,
				value: this.modelSettings.learnRate,
				valueLabel: this.utils.getDefaultModelSettingName(this.defaultModelSettings, settings.learnRate),
				default: this.utils.getDefaultModelSettingValue(this.defaultModelSettings, settings.learnRate),
			};
		}
	}

	return commonUtils.build('gradient-boosting-machine-settings', GradientBoostingMachineSettings, view);
});