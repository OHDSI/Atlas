const bustCache = (() => {
	const key = 'bustCache';
	let hash = localStorage.getItem(key) || (localStorage[key] = Math.random().toString(36).substring(7));
	return '_=' + hash;
})();

requirejs.config({
	baseUrl: 'js',
	config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				return true;
			}
		},
	},
	urlArgs: bustCache,
	packages: [{
			name: "databindings",
			location: "modules/databindings"
		},
		{
			name: "cohortdefinitionviewer",
			location: "components/cohortdefinitionviewer"
		},
		{
			name: "circe",
			location: "modules/circe"
		},
		{
			name: "iranalysis",
			location: "modules/iranalysis"
		},
		{
			name: "extenders",
			location: "extenders"
		},
		{
			name: "job",
			location: "modules/job"
		},
		{
			name: "plp",
			location: "modules/plp"
		},
		{
			name: "pages",
			location: "pages",
		},
	],
	shim: {
		"colorbrewer": {
			exports: 'colorbrewer'
		},
		"bootstrap": {
			"deps": [
				'jquery'
			]
		},
		"prism": {
			"prism": {
				"exports": "Prism"
			}
		},
		"xss": {
			exports: "filterXSS"
		}
	},
	map: {
		"*": {
			'jquery-ui/ui/widgets/sortable': 'jquery-ui',
			'jquery-ui/ui/widgets/draggable': 'jquery-ui',
			'jquery-ui/ui/widgets/droppable': 'jquery-ui',
			'jquery-ui/dialog': 'jquery-ui',
			'jquery-ui/autocomplete': 'jquery-ui',
			'jquery-ui/tabs': 'jquery-ui',
			'jqueryui/jquery.ddslick': 'assets/jqueryui/jquery.ddslick',
			'jqueryui/autoGrowInput': 'assets/jqueryui/autoGrowInput',
		}
	},
	deps: ['css!styles/jquery.dataTables.min',
		'css!styles/jquery.dataTables.colVis.css'
	],
	paths: {
		"jquery": "https://code.jquery.com/jquery-1.11.2.min",
		"jquery-ui": "https://code.jquery.com/ui/1.11.4/jquery-ui.min",
		"bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min",
		"text": "plugins/text",
		"css": "plugins/css.min",
    "less": "plugins/less",
		"optional": "plugins/optional",
		"clipboard": "assets/clipboard.min",
		"knockout": "assets/knockout.min",
		"ko.sortable": "https://cdnjs.cloudflare.com/ajax/libs/knockout-sortable/1.1.0/knockout-sortable.min",
		"knockout-mapping": "assets/knockout.mapping",
		"datatables.net": "assets/jquery.dataTables.min",
		"datatables.net-buttons": "assets/jquery.dataTables.buttons.min",
		"datatables.net-buttons-html5": "assets/jquery.dataTables.buttons.html5.min",
		"colvis": "assets/jquery.dataTables.colVis.min",
		"crossfilter": "https://cdnjs.cloudflare.com/ajax/libs/crossfilter2/1.4.1/crossfilter.min",
		"director": "assets/director.min",
		"configuration": "components/configuration",
		"source-manager": "components/source-manager",
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
		"ir-manager": "components/ir-manager",
		"ir-browser": "components/ir-browser",
		"faceted-datatable": "components/faceted-datatable",
		"profile-manager": "components/profile/profile-manager",
		"explore-cohort": "components/explore-cohort",
		"r-manager": "components/r-manager",
		"negative-controls": "components/negative-controls",
		"atlascharts": "https://unpkg.com/@ohdsi/atlascharts@1.4.1/dist/atlascharts.min",
		"jnj_chart": "assets/jnj.chart", // scatterplot is not ported to separate library
		"lodash": "assets/lodash.4.15.0.full",
		"lscache": "assets/lscache.min",
		"localStorageExtender": "assets/localStorageExtender",
		"conceptsetbuilder": "modules/conceptsetbuilder",
		"conceptpicker": "modules/conceptpicker",
		"webapi": "modules/WebAPIProvider",
		"vocabularyprovider": "modules/WebAPIProvider/VocabularyProvider",
		"appConfig": "config",
		"home": "components/home",
		"prism": "assets/prism",
		"sptest": "sptest/sptest",
		"sptest_smoking": "sptest/sptest_smoking",
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
    "js-cookie": "https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.0/js.cookie.min",

    "d3": "https://cdnjs.cloudflare.com/ajax/libs/d3/4.10.0/d3.min",
		"d3-collection": "https://cdnjs.cloudflare.com/ajax/libs/d3-collection/1.0.4/d3-collection.min",
		"d3-selection": "https://cdnjs.cloudflare.com/ajax/libs/d3-selection/1.1.0/d3-selection.min",
		"d3-shape": "https://cdnjs.cloudflare.com/ajax/libs/d3-shape/1.2.0/d3-shape.min",
		"d3-drag": "https://cdnjs.cloudflare.com/ajax/libs/d3-drag/1.1.1/d3-drag.min",
		"d3-scale": "https://cdnjs.cloudflare.com/ajax/libs/d3-scale/1.0.6/d3-scale.min",
		"d3-array": "https://cdnjs.cloudflare.com/ajax/libs/d3-array/1.2.0/d3-array.min",
		"d3-interpolate": "https://cdnjs.cloudflare.com/ajax/libs/d3-interpolate/1.1.5/d3-interpolate.min",
		"d3-format": "https://cdnjs.cloudflare.com/ajax/libs/d3-format/1.2.0/d3-format.min",
		"d3-time": "https://cdnjs.cloudflare.com/ajax/libs/d3-time/1.0.7/d3-time.min",
		"d3-time-format": "https://cdnjs.cloudflare.com/ajax/libs/d3-time-format/2.0.5/d3-time-format.min",
		"d3-color": "https://cdnjs.cloudflare.com/ajax/libs/d3-color/1.0.3/d3-color.min",
		"d3-path": "https://cdnjs.cloudflare.com/ajax/libs/d3-path/1.0.5/d3-path.min",
		"d3-dispatch": "https://cdnjs.cloudflare.com/ajax/libs/d3-dispatch/1.0.3/d3-dispatch.min",
		"d3-tip": "https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.7.1/d3-tip.min",
		"d3-slider": "d3.slider",
		"xss": "https://cdnjs.cloudflare.com/ajax/libs/js-xss/0.3.3/xss.min",

		"moment": "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.19.2/moment.min",
		"querystring": "https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs.min",

    "bootstrap-select": "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/js/bootstrap-select",
    "bootstrap-select-css": "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.13.0-beta/css/bootstrap-select.min",
    "less-js": "https://cdnjs.cloudflare.com/ajax/libs/less.js/3.0.1/less.min",
		"file-saver": "assets/FileSaver", //"https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min",
		"numeral": "assets/numeral",
		"lz-string": "assets/lz-string",
		"jquery.ui.autocomplete.scroll": "assets/jquery.ui.autocomplete.scroll",
		"facets": "assets/facets",
		"colorbrewer": "assets/colorbrewer",
		"ohdsi-api": "https://unpkg.com/@ohdsi/ui-toolbox@1.0.0/lib/umd/api/index",
		// needed for @ohdsi/ui-toolbox Api
		"urijs": "https://unpkg.com/urijs@1.19.1/src/URI",
		"punycode": "https://unpkg.com/urijs@1.19.1/src/punycode",
		"SecondLevelDomains": "https://unpkg.com/urijs@1.19.1/src/SecondLevelDomains",		
		"IPv6": "https://unpkg.com/urijs@1.19.1/src/IPv6",
	}
});

requirejs(['bootstrap'], function () { // bootstrap must come first
    $.fn.bstooltip = $.fn.tooltip;
	requirejs([
		'knockout',
		'app',
		'appConfig',
		'webapi/AuthAPI',
		'webapi/SourceAPI',
		'assets/ohdsi.util',
		'lscache',
		'atlas-state',
		'vocabularyprovider',
		'providers/Vocabulary',
		'services/http',
		'webapi/ExecutionAPI',
		'webapi/ConceptSetAPI',
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
			vocabProvider,
			httpService,
			executionAPI,
			conceptSetApi,
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

					if (daimon.daimonType == 'Evidence') {
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

		pageModel.loadAncestors = conceptSetApi.loadAncestors;
		
		pageModel.loadAndApplyAncestors = function(data) {
			const selectedConceptIds = sharedState.selectedConcepts().filter(v => !v.isExcluded()).map(v => v.concept.CONCEPT_ID);
			const ids = data.filter(e => _.isEmpty(e.ANCESTORS) && sharedState.selectedConceptsIndex[e.CONCEPT_ID] !== 1)
				.map(e => e.CONCEPT_ID);
			let resultPromise = $.Deferred();
			if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
				pageModel.loadAncestors(selectedConceptIds, ids).then(ancestors => {
					const map = pageModel.includedConceptsMap();
					data.filter(line => !_.isEmpty(ancestors[line.CONCEPT_ID]) && _.isEmpty(line.ANCESTORS))
						.forEach(line => {
							const ancArray = ancestors[line.CONCEPT_ID];
							line.ANCESTORS = ancArray.map(conceptId => map[conceptId]);
					});
					resultPromise.resolve();
				});
			} else {
				resultPromise.resolve();
			}
			return resultPromise;
		};
		
		pageModel.loadIncluded = function (identifiers) {
			pageModel.loadingIncluded(true);
			var includedPromise = $.Deferred();

			vocabProvider.lookupIdentifiers(identifiers || pageModel.conceptSetInclusionIdentifiers())
				.then(data => {
					var densityPromise = vocabAPI.loadDensity(data);

					$.when(densityPromise)
						.done(function () {
							pageModel.includedConcepts(data.map(v => ({...v, ANCESTORS: []})));
							includedPromise.resolve();
							pageModel.loadAndApplyAncestors(pageModel.includedConcepts());
							pageModel.loadingIncluded(false);
							pageModel.setIncludedConceptsMap(data);
						});
				});

			return includedPromise;
		}

		pageModel.setIncludedConceptsMap = function(data) {
			const map = data.reduce((result, item) => {
				result[item.CONCEPT_ID] = item;
				return result;
				}, {});
			pageModel.includedConceptsMap(map);
		};
		
		pageModel.loadSourcecodes = function () {
			pageModel.loadingSourcecodes(true);

			// load mapped
			var identifiers = [];
			var concepts = pageModel.includedConcepts();
			for (var i = 0; i < concepts.length; i++) {
				identifiers.push(concepts[i].CONCEPT_ID);
			}

			return vocabAPI.loadSourceCodes(identifiers);
		}

		function loadIncluded() {
			var promise;
			if (pageModel.includedConcepts().length == 0) {
				promise = pageModel.loadIncluded();
			} else {
				promise = $.Deferred();
				promise.resolve();
			}
			return promise;
		}

		pageModel.currentConceptSetMode.subscribe(function (newMode) {
			switch (newMode) {
				case 'included':
					loadIncluded();
					break;
				case 'sourcecodes':
					loadIncluded()
						.then(function () {
							if (pageModel.includedSourcecodes().length === 0) {
								pageModel.loadSourcecodes();
							}
						});
					break;
			}
		});

		// handle select all
		$(document)
			.on('click', 'th i.fa.fa-shopping-cart', function () {
				if (pageModel.currentConceptSet() == undefined) {
					var newConceptSet = {
						name: ko.observable("New Concept Set"),
						id: 0
					}
					pageModel.currentConceptSet(newConceptSet);
				}

				var table = $(this)
					.closest('.dataTable')
					.DataTable();
				var concepts = table.rows({
						search: 'applied'
					})
					.data();
				var selectedConcepts = sharedState.selectedConcepts();

				for (var i = 0; i < concepts.length; i++) {
					var concept = concepts[i];
					if (sharedState.selectedConceptsIndex[concept.CONCEPT_ID]) {
						// ignore if already selected
					} else {
						var conceptSetItem = pageModel.createConceptSetItem(concept);
						sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
						selectedConcepts.push(conceptSetItem)
					}
				}
				sharedState.selectedConcepts(selectedConcepts);
				ko.contextFor(this)
					.$component.reference.valueHasMutated();
			});

		// handling concept set selections
		$(document)
			.on('click', 'td i.fa.fa-shopping-cart, .asset-heading i.fa.fa-shopping-cart', function () {
				if (pageModel.currentConceptSet() == undefined) {
					var newConceptSet = {
						name: ko.observable("New Concept Set"),
						id: 0
					}
					pageModel.currentConceptSet({
						name: ko.observable('New Concept Set'),
						id: 0
					});
					pageModel.currentConceptSetSource('repository');
				}

				$(this)
					.toggleClass('selected');
				var concept = ko.contextFor(this)
					.$data;

				if ($(this)
					.hasClass('selected')) {
					var conceptSetItem = pageModel.createConceptSetItem(concept);
					sharedState.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
					sharedState.selectedConcepts.push(conceptSetItem);
				} else {
					delete sharedState.selectedConceptsIndex[concept.CONCEPT_ID];
					sharedState.selectedConcepts.remove(function (i) {
						return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
					});
				}

				// If we are updating a concept set that is part of a cohort definition
				// then we need to notify any dependent observables about this change in the concept set
				if (pageModel.currentCohortDefinition() && pageModel.currentConceptSetSource() === "cohort") {
					var conceptSet = pageModel.currentCohortDefinition()
						.expression()
						.ConceptSets()
						.find(function (item) {
							return item.id === pageModel.currentConceptSet().id;
						});
					if (!$(this).hasClass("selected")) {
						conceptSet.expression.items.remove(function (i) {
							return i.concept.CONCEPT_ID === concept.CONCEPT_ID;
						});
					}
					conceptSet.expression.items.valueHasMutated();
					pageModel.resolveConceptSetExpressionSimple(ko.toJSON(conceptSet.expression))
						.then(pageModel.loadIncluded)
						.then(pageModel.loadSourcecodes);
				}
			});

		// concept set selector handling
		$(document)
			.on('click', '.conceptSetTable i.fa.fa-shopping-cart', function () {
				$(this)
					.toggleClass('selected');
				var conceptSetItem = ko.contextFor(this)
					.$data;

				delete sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID];
				sharedState.selectedConcepts.remove(function (i) {
					return i.concept.CONCEPT_ID == conceptSetItem.concept.CONCEPT_ID;
				});

				pageModel.resolveConceptSetExpression();
			});

		$(window)
			.bind('beforeunload', function () {
				if (pageModel.hasUnsavedChanges())
					return "Changes will be lost if you do not save.";
			});
	});
});
