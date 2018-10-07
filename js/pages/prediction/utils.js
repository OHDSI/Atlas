define(
    (require, exports) => {
  
    var ko = require('knockout');
    var ModelSettings = require('./inputTypes/ModelSettings');

    function getDefaultModelSettings(modelName) {
        return ModelSettings.defaultModelSettings.filter(function (item) {
            return item.name == modelName;
        })[0].modelSettings
    }

    function getDefaultModelSettingDescription(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(function (item) {
            return item.setting == settingName;
        });
        if (settingList.length > 0) {
            return settingList[0].description + " (default = " + settingList[0].defaultValue + "):";
        } else {
            return "SETTING NOT FOUND!!";
        }
    }

    function getDefaultModelSettingValue(defaultModelSettings, settingName) {
        const settingList = defaultModelSettings.filter(function (item) {
            return item.setting == settingName;
        });
        if (settingList.length > 0) {
            return settingList[0].defaultValue;
        } else {
            return "SETTING NOT FOUND!!";
        }
    }

    function getDefaultModelSettingsValueList(modelName) {
        const defaultModelSettings = getDefaultModelSettings(modelName);
        var defaultValuesList = {};
        defaultModelSettings.forEach(element => {
            var setting = element["setting"];
            var defaultValue = element["defaultValue"];
            defaultValuesList[setting] = defaultValue;
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