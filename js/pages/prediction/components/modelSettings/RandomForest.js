define([
	'knockout', 
	'text!./RandomForest.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class RandomForest extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.mtries = {
				name: 'mtries',
				value: this.modelSettings.mtries,
			};
			this.ntrees = {
				name: 'ntrees',
				value: this.modelSettings.ntrees,
			};
			this.maxDepth = {
				name: 'maxDepth',
				value: this.modelSettings.maxDepth,
			};
			this.varImp = {
				name: 'varImp',
				value: this.modelSettings.varImp,
			};
		}
	}

	return commonUtils.build('RandomForest', RandomForest, view);
});