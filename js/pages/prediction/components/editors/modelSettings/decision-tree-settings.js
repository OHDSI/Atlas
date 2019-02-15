define([
	'knockout', 
	'text!./decision-tree-settings.html',
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils'
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
	dataTypeConverterUtils
) {
	class DecisionTreeSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.maxDepth = {
				name: 'maxDepth',
				value: ko.observable(this.modelSettings.maxDepth() && this.modelSettings.maxDepth().length > 0 ? this.modelSettings.maxDepth().join() : ''),
			};
			this.minSamplesSplit = {
				name: 'minSamplesSplit',
				value: ko.observable(this.modelSettings.minSamplesSplit() && this.modelSettings.minSamplesSplit().length > 0 ? this.modelSettings.minSamplesSplit().join() : ''),
			};
			this.minSamplesLeaf = {
				name: 'minSamplesLeaf',
				value: ko.observable(this.modelSettings.minSamplesLeaf() && this.modelSettings.minSamplesLeaf().length > 0 ? this.modelSettings.minSamplesLeaf().join() : ''),
			};
			this.minImpurityDecrease = {
				name: 'minImpurityDecrease',
				value: ko.observable(this.modelSettings.minImpurityDecrease() && this.modelSettings.minImpurityDecrease().length > 0 ? this.modelSettings.minImpurityDecrease().join() : ''),
			};
			this.classWeight = {
				name: 'classWeight',
				value: this.modelSettings.classWeight,
			};
			this.plot = {
				name: 'plot',
				value: this.modelSettings.plot,
			};

			this.subscriptions.push(this.maxDepth.value.subscribe(newValue => {
				this.modelSettings.maxDepth(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.minSamplesSplit.value.subscribe(newValue => {
				this.modelSettings.minSamplesSplit(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.minSamplesLeaf.value.subscribe(newValue => {
				this.modelSettings.minSamplesLeaf(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));

			this.subscriptions.push(this.minImpurityDecrease.value.subscribe(newValue => {
				this.modelSettings.minImpurityDecrease(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			}));
		}
	}

	return commonUtils.build('decision-tree-settings', DecisionTreeSettings, view);
});