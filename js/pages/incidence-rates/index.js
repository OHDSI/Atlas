define((require, exports) => {
	const ko = require('knockout');
	const buildRoutes = require('./routes');
	const appState = require('atlas-state');

	const statusCss = ko.pureComputed(function () {
		if (appState.IRAnalysis.current())
			return appState.IRAnalysis.dirtyFlag()
				.isDirty() ? "unsaved" : "open";
		return "";
	});

	const navUrl = ko.pureComputed(function () {
		let url = "#/iranalysis";
		if (appState.IRAnalysis.current()) {
			url = url + `/${(appState.IRAnalysis.current().id() || 0)}`;
		}
		return url;
	});


	return {
		title: ko.i18n('navigation.incidencerate', 'Incidence Rates'),
		buildRoutes,
		icon: 'bolt',
		statusCss,
		navUrl
	};
});