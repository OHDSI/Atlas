define([
	'knockout', 
	'text!./NegativeControlOutcomeCohortSettingsEditor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class NegativeControlOutcomeCohortSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.negativeControlCohortSettings = params.negativeControlCohortSettings;
            this.options = options;
		}
	}

	return commonUtils.build('nc-outcome-cohort-settings-editor', NegativeControlOutcomeCohortSettingsEditor, view);
});