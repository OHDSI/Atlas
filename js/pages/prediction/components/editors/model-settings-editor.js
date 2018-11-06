define([
	'knockout', 
	'text!./model-settings-editor.html',	
	'components/Component',
    'utils/CommonUtils',
    './modelSettings/naive-bayes-settings',
    './modelSettings/random-forest-settings',
    './modelSettings/mlp-settings',
    './modelSettings/knn-settings',
    './modelSettings/gradient-boosting-machine-settings',
    './modelSettings/decision-tree-settings',
    './modelSettings/ada-boost-settings',
    './modelSettings/lasso-logistic-regression-settings',
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
            this.editor = params.editor;
		}
	}

	return commonUtils.build('model-settings-editor', ModelSettingsEditor, view);
});