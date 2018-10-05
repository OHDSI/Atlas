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
			
			this.isInteger = RegExp('^[1-9][0-9]*$');
			this.runPlpArgs = params.runPlpArgs();
			this.options = options;
			this.splitSeed = ko.observable(this.runPlpArgs.splitSeed() !== null && this.runPlpArgs.splitSeed() !== 0 ? this.runPlpArgs.splitSeed() : '');

			this.splitSeed.subscribe(newValue => {
				if (newValue === '' || !this.isInteger.test(newValue)) {
					this.runPlpArgs.splitSeed(null);
					this.splitSeed('');
				} else {
					this.runPlpArgs.splitSeed(newValue);
				}
				console.log(this.runPlpArgs.splitSeed());
			});

		}
	}

	return commonUtils.build('evaluation-settings-editor', EvaluationSettingsEditor, view);
});