define([
	'knockout', 
	'text!./population-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
	'../../const',
	'databindings'
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	constants,
) {
	class PopulationSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.populationSettings = params.populationSettings;
			this.options = constants.options;
		}
	}

	return commonUtils.build('population-settings-editor', PopulationSettingsEditor, view);
});