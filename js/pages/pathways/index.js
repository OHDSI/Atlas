define((require, exports) => {
	const ko = require('knockout');
	const constants = require('./const');
	const buildRoutes = require('./routes');
	const appState = require('atlas-state');

	const statusCss = ko.pureComputed(function () {
		if (appState.CohortPathways.current())
			return appState.CohortPathways.dirtyFlag()
				.isDirty() ? "unsaved" : "open";
		return "";
	});

	const navUrl = ko.pureComputed(function () {
		let url = "#/pathways";
		if (appState.CohortPathways.current()) {
			url = url + `/${(appState.CohortPathways.current().id || 0)}`;
		}
		return url;
	});

	return {
		title: ko.i18n('navigation.pathways', constants.pageTitle),
		buildRoutes,
		icon: 'sitemap',
		navUrl: () => '#/pathways',
		statusCss,
		navUrl
	};
});
