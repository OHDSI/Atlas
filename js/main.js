const bustCache = (() => {
	const key = 'bustCache';
	let hash = localStorage.getItem(key) || (localStorage[key] = Math.random().toString(36).substring(7));
	return '_=' + hash;
})();

const localRefs = {
	"configuration": "components/configuration",
	"concept-manager": "components/concept-manager",
	"conceptset-browser": "components/conceptset/conceptset-browser",
	"conceptset-editor": "components/conceptset/conceptset-editor",
	"conceptset-manager": "components/conceptset/conceptset-manager",
	"conceptset-modal": "components/conceptsetmodal/conceptSetSaveModal",
	"conceptset-list-modal": "components/conceptset/conceptset-list-modal",
	"user-bar": "components/user-bar",
	"faceted-datatable": "components/faceted-datatable",
	"explore-cohort": "components/explore-cohort",
	"r-manager": "components/r-manager",
	"home": "components/home",
	"welcome": "components/welcome",
	"forbidden": "components/ac-forbidden",
	"unauthenticated": "components/ac-unauthenticated",
	"roles": "components/roles",
	"role-details": "components/role-details",
	"loading": "components/loading",
	"atlas-state": "components/atlas-state",
	"plp-manager": "components/plp-manager",
	"plp-inspector": "components/plp-inspector",
	"plp-browser": "components/plp-browser",
	"plp-roc": "components/plp-roc",
	"plp-calibration": "components/plp-calibration",
	"plp-spec-editor": "components/plp-spec-editor",
	"plp-r-code": "components/plp-r-code",
	"plp-print-friendly": "components/plp-print-friendly",
	"feedback": "components/feedback",
	"conceptsetbuilder": "modules/conceptsetbuilder",
	"conceptpicker": "modules/conceptpicker",
	"webapi": "modules/WebAPIProvider",
	"vocabularyprovider": "modules/WebAPIProvider/VocabularyProvider",
	"css": "plugins/css.min",
};

// set 'optional' path prior to first call to require
requirejs.config({paths: {"optional": "plugins/optional"}});

require([
	'./settings',
	'optional', // require this plugin separately to check in advance whether we have a local config
	'config'
], (settings, optional, appConfig) => {
	const cdnRefs = {};
	Object.entries(settings.paths).forEach(([name, path]) => {
		cdnRefs[name] = appConfig.useBundled3dPartyLibs
			? 'assets/bundle/bundle'
			: path;
	});

	requirejs.config({
		...settings,
		urlArgs: bustCache,
		deps: ['css!styles/jquery.dataTables.min',
			'css!styles/jquery.dataTables.colVis.css'
		],
		paths: {
			...localRefs,
			...cdnRefs,
		},
	});
	require(['bootstrap'], function () { // bootstrap must come first
    $.fn.bstooltip = $.fn.tooltip;
		require([
			'providers/Application',
			'providers/Model',
			'providers/Router',
			'atlas-state',
			'jquery.ui.autocomplete.scroll',
			'loading',
			'user-bar',
			'welcome',
			'components/white-page'
		],
			(
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
