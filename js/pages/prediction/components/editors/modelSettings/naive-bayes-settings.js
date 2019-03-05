define([
	'knockout', 
	'text!./naive-bayes-settings.html',	
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

	return commonUtils.build('naive-bayes-settings', NaiveBayesSettings, view);
});