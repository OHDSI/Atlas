define((require) => {
	const ko = require('knockout');
	const buildRoutes = require('./routes');
	const appState = require('atlas-state');

	const statusCss = ko.pureComputed(function () {
		if (appState.Reusable.current())
			return appState.Reusable.dirtyFlag()
				.isDirty() ? "unsaved" : "open";
		return "";
	});

	const navUrl = ko.pureComputed(function () {
		let url = "#/reusables";
		if (appState.Reusable.current()) {
			url = url + `/${(appState.Reusable.current().id || 0)}`;
		}
		return url;
	});

	return {
		title: ko.i18n('navigation.reusables', 'Reusables'),
		buildRoutes,
		icon: 'recycle',
		statusCss,
		navUrl
	};
});
