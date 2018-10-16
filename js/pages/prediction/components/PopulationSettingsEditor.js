define([
	'knockout', 
	'text!./PopulationSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings'
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class PopulationSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.populationSettings = params.populationSettings;
			this.options = options;
		}
	}

	return commonUtils.build('population-settings-editor', PopulationSettingsEditor, view);
});