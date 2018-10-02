define([
	'knockout', 
	'text!./ModelSettingsEditor.html',	
	'providers/Component',
    'utils/CommonUtils',
    './modelSettings/NaiveBayesSettings',
    './modelSettings/RandomForestSettings',
    './modelSettings/MLPSettings',
    './modelSettings/KNNSettings',
    './modelSettings/GradientBoostingMachineSettings',
    './modelSettings/DecisionTreeSettings',
    './modelSettings/AdaBoostSettings',
    './modelSettings/LassoLogisticRegressionSettings',
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