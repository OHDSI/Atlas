define([
	'knockout', 
	'text!./KNearestNeighborsSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class KNearestNeighborsSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.k = {
				name: 'k',
				value: this.modelSettings.k,
			};

		}
	}

	return commonUtils.build('KNearestNeighborsSettings', KNearestNeighborsSettings, view);
});