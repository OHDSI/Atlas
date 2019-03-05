define([
	'knockout', 
	'text!./knn-settings.html',	
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

	return commonUtils.build('knn-settings', KNNSettings, view);
});