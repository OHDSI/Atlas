define([
	'knockout', 
	'text!./NaiveBayesSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class NaiveBayesSettings extends ModelSettingsEditorComponent {
		constructor(params) {
            	super(params);
		}
	}

	return commonUtils.build('NaiveBayesSettings', NaiveBayesSettings, view);
});