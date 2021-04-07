define([
	'knockout', 
	'components/Component',
    '../../../utils',
    '../../../const',
	'components/multi-select',
	'components/multi-input/multi-input',
], function (
	ko, 
	Component,
    utils,
    constants
) {
	class ModelSettingsEditorComponent extends Component {
		constructor(params) {
			super(params);
            this.modelSettings = params.modelSettings[this.constructor.name];
            this.defaultModelSettings = utils.getDefaultModelSettings(this.constructor.name);
            this.utils = utils;
            this.constants = constants;
            this.options = constants.options;
            this.trueFalseOptions = ko.observable(this.options.trueFalseOptions);
            this.classWeightOptions = ko.observable(this.options.classWeightOptions);
            this.extenders = constants.extenders;
            this.subscriptions = params.subscriptions;
        }

        modelSettingDescription(settingName) {
            return utils.getDefaultModelSettingDescriptionTranslate(this.defaultModelSettings, settingName);
        }
        getModelSettingByName(settingName) {
            if (!Object.keys(this.modelSettings).indexOf(settingName) < 0) {
                console.error("Setting: " + settingName + " not found in modelSettings");
            }
            return Object.values(this.modelSettings)[Object.keys(this.modelSettings).indexOf(settingName)];
        }
        isDefault(settingName) {
            const setting = this.getModelSettingByName(settingName);
            return JSON.stringify(setting()) === JSON.stringify(utils.getDefaultModelSettingValue(this.defaultModelSettings, settingName));
        }
        setToDefault(settingName) {
            const setting = this.getModelSettingByName(settingName);
            setting(utils.getDefaultModelSettingValue(this.defaultModelSettings, settingName));
        }
    }

	return ModelSettingsEditorComponent;
});