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
	"cohort-comparison-manager": "components/cohort-comparison-manager",
	"job-manager": "components/job-manager",
	"cohort-comparison-browser": "components/cohort-comparison-browser",
	"cohort-comparison-print-friendly": "components/cohort-comparison-print-friendly",
	"cohort-comparison-r-code": "components/cohort-comparison-r-code",
	"cohort-comparison-multi-r-code": "components/cohort-comparison-multi-r-code",
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
<<<<<<< HEAD
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
=======
	require([
		'knockout',
		'app',
		'appConfig',
		'webapi/AuthAPI',
		'webapi/SourceAPI',
		'assets/ohdsi.util',
		'lscache',
		'atlas-state',
		'vocabularyprovider',
		'services/http',
		'webapi/ExecutionAPI',
		'databindings',
		'director',
		'localStorageExtender',
		'jquery.ui.autocomplete.scroll',
		'loading',
		'user-bar',
		'welcome',
	],
		function (
			ko,
			app,
			config,
			authApi,
			sourceApi,
			util,
			lscache,
			sharedState,
			vocabAPI,
			httpService,
			executionAPI
		) {
		var pageModel = new app();
		window.pageModel = pageModel;

		ko.applyBindings(pageModel, document.getElementsByTagName('html')[0]);
		httpService.setUnauthorizedHandler(() => authApi.resetAuthParams());
		httpService.setUserTokenGetter(() => authApi.getAuthorizationHeader());

		// establish base priorities for daimons
		var evidencePriority = 0;
		var vocabularyPriority = 0;
		var densityPriority = 0;

		// initialize all service information asynchronously
		var serviceCacheKey = 'ATLAS|' + config.api.url;
		cachedService = lscache.get(serviceCacheKey);

		if (cachedService && cachedService.sources) {
			console.log('cached service');
			config.api = cachedService;

			for (var s = 0; s < cachedService.sources.length; s++) {
				var source = cachedService.sources[s];

				for (var d = 0; d < source.daimons.length; d++) {
					var daimon = source.daimons[d];

					if (daimon.daimonType == 'Vocabulary') {
						if (daimon.priority >= vocabularyPriority) {
							vocabularyPriority = daimon.priority;
							sharedState.vocabularyUrl(source.vocabularyUrl);
						}
					}

					if (daimon.daimonType == 'CEM') {
						if (daimon.priority >= evidencePriority) {
							evidencePriority = daimon.priority;
							sharedState.evidenceUrl(source.evidenceUrl);
						}
					}

					if (daimon.daimonType == 'Results') {
						if (daimon.priority >= densityPriority) {
							densityPriority = daimon.priority;
							sharedState.resultsUrl(source.resultsUrl);
						}
					}
				}
			}
		} else {
			sharedState.sources([]);

      if (authApi.isAuthenticated()) {
        sourceApi.initSourcesConfig();
      } else {
        var wasInitialized = false;
        authApi.isAuthenticated.subscribe(function(isAuthed) {
          if (isAuthed && !wasInitialized) {
            sourceApi.initSourcesConfig();
            wasInitialized = true;
          }
        });
      }
		}


		config.api.isExecutionEngineAvailable = ko.observable(false);
		authApi.isAuthenticated.subscribe(executionAPI.checkExecutionEngineStatus);
		executionAPI.checkExecutionEngineStatus(authApi.isAuthenticated());


		$.when.apply($, pageModel.initPromises).done(function () {
			pageModel.initComplete();
		});

		pageModel.currentView.subscribe(function (newView) {
			switch (newView) {
				case 'reports':
					$.ajax({
						url: config.api.url + 'cohortdefinition',
						method: 'GET',
						contentType: 'application/json',
						success: function (cohortDefinitions) {
							pageModel.cohortDefinitions(cohortDefinitions);
						}
					});
					break;
			}
		});

		pageModel.loadAncestors = function(ancestors, descendants) {
			return $.ajax({
				url: sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({
					ancestors: ancestors,
					descendants: descendants
				})
			});
		};
		
		pageModel.loadAndApplyAncestors = function(data) {
			const selectedConceptIds = sharedState.selectedConcepts().filter(v => !v.isExcluded()).map(v => v.concept.CONCEPT_ID);
			const ids = [];
			$.each(data, (i, element ) => {
				if (_.isEmpty(element.ANCESTORS) && sharedState.selectedConceptsIndex[element.CONCEPT_ID] !== 1) {
					ids.push(element.CONCEPT_ID);
				}
			});
			let resultPromise = $.Deferred();
			if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
				pageModel.loadAncestors(selectedConceptIds, ids).then(ancestors => {
					const map = pageModel.includedConceptsMap();
					$.each(data, (j, line) => {
						const ancArray = ancestors[line.CONCEPT_ID];
						if (!_.isEmpty(ancArray) && _.isEmpty(line.ANCESTORS)) {
							line.ANCESTORS = ancArray.map(conceptId => map[conceptId]);
						}
>>>>>>> master
					});

				return app;
		});
	});
});
