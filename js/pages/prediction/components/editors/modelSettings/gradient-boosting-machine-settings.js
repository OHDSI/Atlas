define([
	'knockout', 
	'text!./gradient-boosting-machine-settings.html',	
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
	class GradientBoostingMachineSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			
			this.ntrees = {
				name: 'ntrees',
				value: ko.observable(this.modelSettings.ntrees() && this.modelSettings.ntrees().length > 0 ? this.modelSettings.ntrees().join() : ''),
			};
			this.nthread = {
				name: 'nthread',
				value: this.modelSettings.nthread,
			};
			this.maxDepth = {
				name: 'maxDepth',
				value: ko.observable(this.modelSettings.maxDepth() && this.modelSettings.maxDepth().length > 0 ? this.modelSettings.maxDepth().join() : ''),
			};
			this.minRows = {
				name: 'minRows',
				value: ko.observable(this.modelSettings.minRows() && this.modelSettings.minRows().length > 0 ? this.modelSettings.minRows().join() : ''),
			};
			this.learnRate = {
				name: 'learnRate',
				value: ko.observable(this.modelSettings.learnRate() && this.modelSettings.learnRate().length > 0 ? this.modelSettings.learnRate().join() : ''),
			};

			this.subscriptions.push(this.ntrees.value.subscribe(newValue => {
				this.modelSettings.ntrees(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.maxDepth.value.subscribe(newValue => {
				this.modelSettings.maxDepth(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.minRows.value.subscribe(newValue => {
				this.modelSettings.minRows(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.learnRate.value.subscribe(newValue => {
				this.modelSettings.learnRate(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
		}
	}

	return commonUtils.build('gradient-boosting-machine-settings', GradientBoostingMachineSettings, view);
});