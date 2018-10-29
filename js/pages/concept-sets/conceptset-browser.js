define([
	'knockout',
	'text!./conceptset-browser.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'components/heading',
	'components/tabs',
	'./components/conceptsets-list',
	'./components/conceptsets-export',
], function (
	ko,
	view,
	Page,
	AutoBind,
	commonUtils,
) {
	class ConceptsetBrowser extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.componentParams = params;
		}
	}

	return commonUtils.build('conceptset-browser', ConceptsetBrowser, view);
});