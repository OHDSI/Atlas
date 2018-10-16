define([
	'knockout', 
	'text!./EvaluationSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils',
	'../options',
	'databindings'
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	dataTypeConverterUtils,
	options,
) {
	class EvaluationSettingsEditor extends Component {
		constructor(params) {
			super(params);
			
			this.isInteger = RegExp('^[1-9][0-9]*$');
			this.runPlpArgs = params.runPlpArgs();
			this.options = options;
			this.splitSeed = ko.observable(this.runPlpArgs.splitSeed() !== null && this.runPlpArgs.splitSeed() !== 0 ? this.runPlpArgs.splitSeed() : '');
			this.testFraction = ko.observable(this.runPlpArgs.testFraction() ? dataTypeConverterUtils.convertFromPercent(this.runPlpArgs.testFraction()) : '');

			this.splitSeed.subscribe(newValue => {
				if (newValue === '' || !this.isInteger.test(newValue)) {
					this.runPlpArgs.splitSeed(null);
					this.splitSeed('');
				} else {
					this.runPlpArgs.splitSeed(newValue);
				}
			});

			this.testFraction.subscribe(newValue => {
				this.runPlpArgs.testFraction(dataTypeConverterUtils.convertToPercent(newValue));
			});
		}
	}

	return commonUtils.build('evaluation-settings-editor', EvaluationSettingsEditor, view);
});