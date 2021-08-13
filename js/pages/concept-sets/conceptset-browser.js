define([
	'knockout',
	'text!./conceptset-browser.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/AuthAPI',
	'components/heading',
	'components/tabs',
	'./components/conceptsets-list',
	'./components/conceptsets-export',
	'less!./conceptset-browser.less',
], function (
	ko,
	view,
	Page,
	AutoBind,
	commonUtils,
	authAPI,
) {
	class ConceptsetBrowser extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.componentParams = params;

			this.isAuthenticated = authAPI.isAuthenticated;
			this.hasAccess = authAPI.isPermittedReadConceptsets;
		}
	}

	return commonUtils.build('conceptset-browser', ConceptsetBrowser, view);
});