define([
	'knockout', 
	'text!./NaiveBayes.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class NaiveBayes extends ModelSettingsEditorComponent {
		constructor(params) {
            	super(params);
		}
	}

	return commonUtils.build('NaiveBayes', NaiveBayes, view);
});