define(
    (require, exports) => {

    const ModelSettings = require('./inputTypes/ModelSettings');
    const ko = require('knockout');

    function getDefaultModelSettings(modelName) {
        return ModelSettings.defaultModelSettings.find(item => item.name === modelName).modelSettings;
    }

    function getDefaultModelSettingDescription(defaultModelSettings, settingName) {
        const setting = defaultModelSettings.find(item => item.setting === settingName);
        return setting.description + " (default = " + setting.defaultValue + "):";
    }
    function getDefaultModelSettingDescriptionTranslate(defaultModelSettings, settingName) {
        const setting = defaultModelSettings.find(item => item.setting === settingName);
        return ko.unwrap(setting.description) + ko.unwrap(ko.i18nformat('predictions.default', '(default = <%=defaultValue%>):', {defaultValue: setting.defaultValue}));
    }

    function getDefaultModelSettingValue(defaultModelSettings, settingName) {
        return defaultModelSettings.find(item => item.setting === settingName).defaultValue;
    }

    function getDefaultModelSettingName(defaultModelSettings, settingName) {
        return defaultModelSettings.find(item => item.setting === settingName).name;
    }

    function getDefaultModelSettingsValueList(modelName) {
        const defaultModelSettings = getDefaultModelSettings(modelName);
        const defaultValuesList = {};
        defaultModelSettings.forEach(element => {
            const setting = element["setting"];
            defaultValuesList[setting] = element["defaultValue"];
        });
        return defaultValuesList;
    }

    const utils = {
        getDefaultModelSettings: getDefaultModelSettings,
        getDefaultModelSettingDescription: getDefaultModelSettingDescription,
        getDefaultModelSettingName: getDefaultModelSettingName,
        getDefaultModelSettingValue: getDefaultModelSettingValue,
        getDefaultModelSettingsValueList: getDefaultModelSettingsValueList,
        getDefaultModelSettingDescriptionTranslate,
    };

    return utils;
});