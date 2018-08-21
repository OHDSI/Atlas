define([
	'knockout', 
	'text!./PopulationSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
) {
	class PopulationSettingsEditor extends Component {
		constructor(params) {
            super(params);

            this.populationSettings = params.populationSettings;
		}
	}

	return commonUtils.build('population-settings-editor', PopulationSettingsEditor, view);;
});