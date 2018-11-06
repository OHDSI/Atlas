define([
	'knockout', 
	'text!./mlp-settings.html',	
	'./ModelSettingsEditorComponent',
	'utils/CommonUtils',
	'utils/DataTypeConverterUtils'
], function (
	ko, 
	view, 
	ModelSettingsEditorComponent,
	commonUtils,
	dataTypeConverterUtils,
) {
	class MLPSettings extends ModelSettingsEditorComponent {
		constructor(params) {
			super(params);

			this.size = {
				name: 'size',
				value: ko.observable(this.modelSettings.size() && this.modelSettings.size().length > 0 ? this.modelSettings.size().join() : ''),
			};

			this.alpha = {
				name: 'alpha',
				value: ko.observable(this.modelSettings.alpha() && this.modelSettings.alpha().length > 0 ? this.modelSettings.alpha().join() : ''),
			};	

			this.size.value.subscribe(newValue => {
				this.modelSettings.size(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});

			this.alpha.value.subscribe(newValue => {
				this.modelSettings.alpha(dataTypeConverterUtils.commaDelimitedListToNumericArray(newValue));
			});
		}
	}

	return commonUtils.build('mlp-settings', MLPSettings, view);
});