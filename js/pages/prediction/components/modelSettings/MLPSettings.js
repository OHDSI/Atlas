define([
	'knockout', 
	'text!./MLPSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class MLPSettings extends ModelSettingsEditorComponent {
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

	return commonUtils.build('MLPSettings', MLPSettings, view);
});