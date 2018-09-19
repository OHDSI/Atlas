define([
	'knockout', 
	'text!./AdaBoostSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class AdaBoostSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.learningRate = {
				name: 'learningRate',
				value: this.modelSettings.learningRate,
			};
			this.nEstimators = {
				name: 'nEstimators',
				value: this.modelSettings.nEstimators,
			};
		}
	}

	return commonUtils.build('AdaBoostSettings', AdaBoostSettings, view);
});