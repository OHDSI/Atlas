define([
	'knockout', 
	'text!./GradientBoostingMachine.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class GradientBoostingMachine extends ModelSettingsEditorComponent {
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

	return commonUtils.build('GradientBoostingMachine', GradientBoostingMachine, view);
});