const bustCache = (() => {
	const key = 'bustCache';
	let hash = localStorage.getItem(key) || (localStorage[key] = Math.random().toString(36).substring(7));
	return '_=' + hash;
})();

require(["./settings"], (settings) => {
	requirejs.config({
		...settings,
		paths: {
			...settings.paths,
			...settings.localRefs,
		},
//		urlArgs: bustCache,
	});	
	require([
		'bootstrap',
		'ko.sortable',
		'services/PluginRegistry',
		...Object.values(settings.cssPaths),
	], function () { // bootstrap must come first
    $.fn.bstooltip = $.fn.tooltip;
		require([
			'knockout',
			'Application',
			'Model',
			'appConfig',
			'const',
			'pages/Router',
			'atlas-state',
			'loading',
			'user-bar',
			'welcome',
			'components/white-page',
			'components/terms-and-conditions/terms-and-conditions',
		],
			(
				ko,
				Application,
				Model,
				appConfig,
				constants,
				Router,
				sharedState,
			) => {
				const app = new Application(new Model(), new Router());

				app.bootstrap()
					.then(() => app.checkOAuthError())
					.then(() => app.synchronize())
					.then(() => require(appConfig.externalLibraries, () => console.log('Loaded external plugins')))
					.catch(er => {
						sharedState.appInitializationStatus(constants.applicationStatuses.failed);
						console.error('App initialization failed', er);
					});

				return app;
		});
	});
});
