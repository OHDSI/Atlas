const bustCache = (() => {
	const key = 'bustCache';
	let hash = localStorage.getItem(key) || (localStorage[key] = Math.random().toString(36).substring(7));
	return '_=' + hash;
})();

// set 'optional' path prior to first call to require
requirejs.config({paths: { "text": "extensions/plugins/text", "appConfig": "./config" }});

const initialDeps = ['./settings'];
if (typeof document === 'undefined') {
	// if bundling
	initialDeps.push('@babel/polyfill');
}

require(initialDeps, (settings) => {
	requirejs.config({
		...settings,
		paths: {
			...settings.paths,
			...settings.localRefs,
		},
		urlArgs: bustCache,
	});	
	require([
		'bootstrap',
		'jquery-ui',
		'ko.sortable',
		...Object.values(settings.cssPaths),
	], function () { // bootstrap must come first
    $.fn.bstooltip = $.fn.tooltip;
		require([
			'knockout',
			'Application',
			'Model',
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
				Router,
				sharedState,
			) => {
				const app = new Application(new Model(), new Router());

				app.bootstrap()
					.then(() => app.synchronize())
					.then(() => app.run())
					.catch(er => {
						sharedState.appInitializationStatus(Model.applicationStatuses.failed);
						console.error('App initialization failed', er);
					});

				return app;
		});
	});
});
