define([
	'knockout', 
	'text!./temporal-covariate-settings-editor.html',	
	'components/Component',
	'utils/CommonUtils',
    'appConfig',
    '../InputTypes/TemporalCovariateSettings',
    'less!./featureextraction.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
    TemporalCovariateSettings
) {
	class TemporalCovariateSettingsEditor extends Component {
		constructor(params) {
            super(params);
            
            this.covariateSettings = (params.covariateSettings == null ? new TemporalCovariateSettings() : params.covariateSettings);;
		}
	}

	return commonUtils.build('temporal-covar-settings-editor', TemporalCovariateSettingsEditor, view);
});