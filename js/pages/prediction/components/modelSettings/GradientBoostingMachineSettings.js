define([
	'knockout', 
	'text!./GradientBoostingMachineSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class GradientBoostingMachineSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.ntrees = {
				name: 'ntrees',
				value: this.modelSettings.ntrees,
			};
			this.nthread = {
				name: 'nthread',
				value: this.modelSettings.nthread,
			};
			this.maxDepth = {
				name: 'maxDepth',
				value: this.modelSettings.maxDepth,
			};
			this.minRows = {
				name: 'minRows',
				value: this.modelSettings.minRows,
			};
			this.learnRate = {
				name: 'learnRate',
				value: this.modelSettings.learnRate,
			};
		}
	}

	return commonUtils.build('GradientBoostingMachineSettings', GradientBoostingMachineSettings, view);
});