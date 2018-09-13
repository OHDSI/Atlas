define([
	'knockout', 
	'text!./KNearestNeighbors.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class KNearestNeighbors extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.k = {
				name: 'k',
				value: this.modelSettings.k,
			};

		}
	}

	return commonUtils.build('KNearestNeighbors', KNearestNeighbors, view);
});