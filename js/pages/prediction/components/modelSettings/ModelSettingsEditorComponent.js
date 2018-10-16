define([
	'knockout', 
	'providers/Component',
	'../../utils'
], function (
	ko, 
	Component,
	utils,
) {
	class ModelSettingsEditorComponent extends Component {
		constructor(params) {
			super(params);
            this.modelSettings = params[this.constructor.name];
            this.defaultModelSettings = utils.getDefaultModelSettings(this.constructor.name);
            this.utils = utils;
        }

        modelSettingDescription(settingName) {
            return utils.getDefaultModelSettingDescription(this.defaultModelSettings, settingName);
        } 
        getModelSettingByName(settingName) {
            if (!Object.keys(this.modelSettings).indexOf(settingName) < 0) {
                console.error("Setting: " + settingName + " not found in modelSettings");
            }
            return Object.values(this.modelSettings)[Object.keys(this.modelSettings).indexOf(settingName)];
        }
        isDefault(settingName) {
            var setting = this.getModelSettingByName(settingName);
            return setting() == utils.getDefaultModelSettingValue(this.defaultModelSettings, settingName);
        }
        setToDefault(settingName) {
            var setting = this.getModelSettingByName(settingName);
            setting(utils.getDefaultModelSettingValue(this.defaultModelSettings, settingName));
        }
    }

	return ModelSettingsEditorComponent;
});