define([
	'knockout', 
	'text!./execution-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'databindings'
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	constants,
) {
	class ExecutionSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.getPlpDataArgs = params.getPlpDataArgs();
			this.runPlpArgs = params.runPlpArgs();
			this.options = constants.options;
			this.subscriptions = params.subscriptions;
			this.isEditPermitted = params.isEditPermitted;

			this.maxSampleSizeToggle = ko.observable(this.getPlpDataArgs.maxSampleSize() != null || false);
			this.subscriptions.push(this.maxSampleSizeToggle.subscribe(optionVal => {
				if (optionVal == false) {
					this.getPlpDataArgs.maxSampleSize(null);
				} else {
					this.getPlpDataArgs.maxSampleSize(10000);
				}
			}));
		}
	}

	return commonUtils.build('execution-settings-editor', ExecutionSettingsEditor, view);
});