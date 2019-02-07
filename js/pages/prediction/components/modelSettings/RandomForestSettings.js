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
				value: ko.pureComputed({
					read: () => this.modelSettings.mtries() && this.modelSettings.mtries().length > 0 ? this.modelSettings.mtries().join() : '',
					write: (newValue) => {
						this.modelSettings.mtries(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
					}
				})
			};
			this.ntrees = {
				name: 'ntrees',
				value: ko.pureComputed({
					read: () => this.modelSettings.ntrees() && this.modelSettings.ntrees().length > 0 ? this.modelSettings.ntrees().join() : '',
					write: (newValue) => {
						this.modelSettings.ntrees(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
					}
				})
			};
			this.maxDepth = {
				name: 'maxDepth',
				value: ko.pureComputed({
					read: () => this.modelSettings.maxDepth() && this.modelSettings.maxDepth().length > 0 ? this.modelSettings.maxDepth().join() : '',
					write: (newValue) => {
						this.modelSettings.maxDepth(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
					}
				})
			};
			this.varImp = {
				name: 'varImp',
				value: ko.pureComputed({
					read: () => this.modelSettings.varImp() && this.modelSettings.varImp().length > 0 ? this.modelSettings.varImp().join() : '',
					write: (newValue) => {
						this.modelSettings.varImp(dataTypeConverterUtils.commaDelimitedListToBooleanArray(newValue));
					}
				})
			};
		}
	}

	return commonUtils.build('RandomForestSettings', RandomForestSettings, view);
});