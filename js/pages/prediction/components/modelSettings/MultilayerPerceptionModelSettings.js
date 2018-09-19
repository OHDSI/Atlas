define([
	'knockout', 
	'text!./MultilayerPerceptionModelSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class MultilayerPerceptionModelSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			this.size = {
				name: 'size',
				value: this.modelSettings.size,
			};
			this.alpha = {
				name: 'alpha',
				value: this.modelSettings.alpha,
			};	
		}
	}

	return commonUtils.build('MultilayerPerceptionModelSettings', MultilayerPerceptionModelSettings, view);
});