define([
	'knockout', 
	'text!./population-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'const',
	'databindings',
	'less!./population-settings-editor.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	predictionConstants,
	constants,
) {
	class PopulationSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.populationSettings = params.populationSettings;
			this.options = predictionConstants.options;
			this.constants = constants;
		}
	}

	return commonUtils.build('population-settings-editor', PopulationSettingsEditor, view);
});