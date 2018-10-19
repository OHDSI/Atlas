define([
	'knockout', 
	'text!./RandomForestSettings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
	dataTypeConverterUtils,
) {
	class RandomForestSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.mtries = {
				name: 'mtries',
				value: ko.observable(this.modelSettings.mtries() && this.modelSettings.mtries().length > 0 ? this.modelSettings.mtries().join() : ''),
			};
			this.ntrees = {
				name: 'ntrees',
				value: ko.observable(this.modelSettings.ntrees() && this.modelSettings.ntrees().length > 0 ? this.modelSettings.ntrees().join() : ''),
			};
			this.maxDepth = {
				name: 'maxDepth',
				value: ko.observable(this.modelSettings.maxDepth() && this.modelSettings.maxDepth().length > 0 ? this.modelSettings.maxDepth().join() : ''),
			};
			this.varImp = {
				name: 'varImp',
				value: this.modelSettings.varImp,
			};

			this.mtries.value.subscribe(newValue => {
				this.modelSettings.mtries(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.ntrees.value.subscribe(newValue => {
				this.modelSettings.ntrees(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.maxDepth.value.subscribe(newValue => {
				this.modelSettings.maxDepth(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});
		}
	}

	return commonUtils.build('RandomForestSettings', RandomForestSettings, view);
});