define([
	'knockout', 
	'text!./MultilayerPerceptionModel.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class MultilayerPerceptionModel extends ModelSettingsEditorComponent {
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

	return commonUtils.build('MultilayerPerceptionModel', MultilayerPerceptionModel, view);
});