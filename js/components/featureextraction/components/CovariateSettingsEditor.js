define([
	'knockout', 
	'text!./CovariateSettingsEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
    'appConfig',
    '../InputTypes/CovariateSettings',
    'less!./featureextraction.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
    CovariateSettings
) {
	class CovariateSettingsEditor extends Component {
		constructor(params) {
            super(params);
            
            this.covariateSettings = (params.covariateSettings == null ? new CovariateSettings() : (ko.isObservable(params.covariateSettings) ? params.covariateSettings() : params.covariateSettings));

            this.longTermLabel = ko.pureComputed(() => {
                return this.getWindowLabel(this.covariateSettings.longTermStartDays());
            });

            this.mediumTermLabel = ko.pureComputed(() => {
                return this.getWindowLabel(this.covariateSettings.mediumTermStartDays());
            });

            this.shortTermLabel = ko.pureComputed(() => {
                return this.getWindowLabel(this.covariateSettings.shortTermStartDays());
            });

            this.getWindowLabel = function(value) {
                var dayLabel = Math.abs(value) === 1 ? "day" : "days";
                return "(" + value + " " + dayLabel + ")";
            }
		}
	}

	return commonUtils.build('covar-settings-editor', CovariateSettingsEditor, view);
});