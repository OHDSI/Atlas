define([
	'knockout', 
	'text!./OutcomeModelArgsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
	'cyclops',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class OutcomeModelArgsEditor extends Component {
		constructor(params) {
            super(params);

			this.outcomeModelArgs = params.outcomeModelArgs;
            this.options = options;
		}
	}

	return commonUtils.build('outcome-model-args-editor', OutcomeModelArgsEditor, view);
});