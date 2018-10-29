define([
	'knockout', 
	'text!./KNNSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class KNNSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.k = {
				name: 'k',
				value: this.modelSettings.k,
			};

		}
	}

	return commonUtils.build('KNNSettings', KNNSettings, view);
});