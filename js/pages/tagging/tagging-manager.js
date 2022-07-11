define([
	'knockout',
	'text!./tagging-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'services/Tags',
	'appConfig',
	'services/AuthAPI',
	'databindings',
	'components/ac-access-denied',
	'components/heading',
	'components/tabs',
	'./tabs/multi-assign',
],
	function (
		ko,
		view,
		Page,
		AutoBind,
		commonUtils,
		tagsService,
		config,
		authApi
	) {
	class TaggingManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.isAuthenticated = authApi.isAuthenticated;
			this.selectedTabKey = ko.observable('multi-assign');
		}

		selectTab(index, { key }) {
			//commonUtils.routeTo(`/tagging/${key}`);
		}
	}

	return commonUtils.build('tagging-manager', TaggingManager, view);
});
