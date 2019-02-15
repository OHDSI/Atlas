define(
    (require, exports) => {

    const ModelSettings = require('./inputTypes/ModelSettings');

    function getDefaultModelSettings(modelName) {
        return ModelSettings.defaultModelSettings.find(item => item.name === modelName).modelSettings
    }

    function getDefaultModelSettingDescription(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(item => item.setting === settingName);
        if (settingList.length > 0) {
            return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
        } else {
            return "SETTING NOT FOUND!!";
        }
    }

    function getDefaultModelSettingValue(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(item => item.setting === settingName);
        if (settingList.length > 0) {
            return settingList[0].defaultValue;
        } else {
            return "SETTING NOT FOUND!!";
        }
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
        getDefaultModelSettingValue: getDefaultModelSettingValue,
        getDefaultModelSettingsValueList: getDefaultModelSettingsValueList,
    };

    return utils;
});