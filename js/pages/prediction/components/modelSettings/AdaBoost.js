define([
	'knockout', 
	'text!./AdaBoost.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class AdaBoost extends ModelSettingsEditorComponent {
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

	return commonUtils.build('AdaBoost', AdaBoost, view);
});