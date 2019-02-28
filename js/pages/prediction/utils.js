define(
    (require, exports) => {

    const ModelSettings = require('./inputTypes/ModelSettings');

    function getDefaultModelSettings(modelName) {
        return ModelSettings.defaultModelSettings.find(item => item.name === modelName).modelSettings;
    }

    function getDefaultModelSettingDescription(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(item => item.setting === settingName);
        return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
    }

    function getDefaultModelSettingValue(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(item => item.setting === settingName);
        return settingList[0].defaultValue;
    }

    function getDefaultModelSettingName(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(item => item.setting === settingName);
        return settingList[0].name;
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
    };

    return utils;
});