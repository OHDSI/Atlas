define([
	'knockout', 
	'text!./DecisionTree.html',
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
) {
	class DecisionTree extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);
			this.maxDepth = {
				name: 'maxDepth',
				value: this.modelSettings.maxDepth,
			};
			this.minSamplesSplit = {
				name: 'minSamplesSplit',
				value: this.modelSettings.minSamplesSplit,
			};
			this.minSamplesLeaf = {
				name: 'minSamplesLeaf',
				value: this.modelSettings.minSamplesLeaf,
			};
			this.minImpurityDecrease = {
				name: 'minImpurityDecrease',
				value: this.modelSettings.minImpurityDecrease,
			};
			this.classWeight = {
				name: 'classWeight',
				value: this.modelSettings.classWeight,
			};
			this.plot = {
				name: 'plot',
				value: this.modelSettings.plot,
			};
		}
	}

	return commonUtils.build('DecisionTree', DecisionTree, view);
});