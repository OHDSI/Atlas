define([
	'knockout', 
	'text!./PositiveControlSythesisSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../options',
	'databindings',
	'cyclops',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	options,
) {
	class PositiveControlSythesisSettingsEditor extends Component {
		constructor(params) {
            super(params);

			this.settings = params.settings;
            this.options = options.positiveControlSynthesisArgs;
		}
	}

	return commonUtils.build('positive-control-synthesis-settings-editor', PositiveControlSythesisSettingsEditor, view);
});