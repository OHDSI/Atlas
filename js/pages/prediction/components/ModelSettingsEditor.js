define([
	'knockout', 
	'text!./ModelSettingsEditor.html',	
	'providers/Component',
    'utils/CommonUtils',
    './modelSettings/NaiveBayes',
    './modelSettings/RandomForest',
    './modelSettings/MultilayerPerceptionModel',
    './modelSettings/KNearestNeighbors',
    './modelSettings/GradientBoostingMachine',
    './modelSettings/DecisionTree',
    './modelSettings/AdaBoost',
    './modelSettings/LassoLogisticRegression',
], function (
	ko, 
	view, 
	Component,
    commonUtils,
) {
	class ModelSettingsEditor extends Component {
		constructor(params) {
            super(params);

            this.modelSettings = params.modelSettings;
            this.modelSettingsKey = Object.keys(params.modelSettings)[0];
		}
	}

	return commonUtils.build('model-settings-editor', ModelSettingsEditor, view);
});