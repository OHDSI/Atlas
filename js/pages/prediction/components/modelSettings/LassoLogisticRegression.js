define([
	'knockout', 
	'text!./LassoLogisticRegression.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class LassoLogisticRegression extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.variance = {
				name: 'variance',
				value: this.modelSettings.variance,
			};
		}
	}

	return commonUtils.build('LassoLogisticRegression', LassoLogisticRegression, view);
});