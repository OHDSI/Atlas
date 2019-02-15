define([
	'knockout', 
	'text!./lasso-logistic-regression-settings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class LassoLogisticRegressionSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.variance = {
				name: 'variance',
				value: this.modelSettings.variance,
			};
		}
	}

	return commonUtils.build('lasso-logistic-regression-settings', LassoLogisticRegressionSettings, view);
});