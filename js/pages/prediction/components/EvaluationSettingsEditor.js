define([
	'knockout', 
	'text!./EvaluationSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings'
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class EvaluationSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.runPlpArgs = params.runPlpArgs();
			this.options = options;
		}
	}

	return commonUtils.build('evaluation-settings-editor', EvaluationSettingsEditor, view);
});