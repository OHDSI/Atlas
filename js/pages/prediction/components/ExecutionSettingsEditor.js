define([
	'knockout', 
	'text!./ExecutionSettingsEditor.html',	
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
	class ExecutionSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.getPlpDataArgs = params.getPlpDataArgs;
			this.options = options;

			this.maxSampleSizeToggle = ko.observable(this.getPlpDataArgs().maxSampleSize() != null || false);
			this.maxSampleSizeToggle.subscribe(optionVal => {
				if (optionVal == false) {
					this.getPlpDataArgs().maxSampleSize(null);
				} else {
					this.getPlpDataArgs().maxSampleSize(10000);
				}
			});
		}
	}

	return commonUtils.build('execution-settings-editor', ExecutionSettingsEditor, view);
});