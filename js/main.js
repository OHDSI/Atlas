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
			location: "modules/cohortdefinitionviewer"
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
			name: "cohortfeatures",
			location: "modules/cohortfeatures"
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
			'jquery-ui/tabs': 'jquery-ui'
		}
	},
	deps: ['css!styles/jquery.dataTables.min',
		'css!styles/jquery.dataTables.colVis.css'
	],
	paths: {
		"jquery": "https://code.jquery.com/jquery-1.11.2.min",
		"jquery-ui": "https://code.jquery.com/ui/1.11.4/jquery-ui.min",
		"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min",
		"text": "plugins/text",
		"css": "plugins/css.min",
		"optional": "plugins/optional",
		"clipboard": "clipboard.min",
		"knockout": "knockout.min",
		"ko.sortable": "https://cdnjs.cloudflare.com/ajax/libs/knockout-sortable/1.1.0/knockout-sortable.min",
		"knockout-mapping": "knockout.mapping",
		"datatables.net": "jquery.dataTables.min",
		"datatables.net-buttons": "jquery.dataTables.buttons.min",
		"datatables.net-buttons-html5": "jquery.dataTables.buttons.html5.min",
		"colvis": "jquery.dataTables.colVis.min",
		"crossfilter": "https://cdnjs.cloudflare.com/ajax/libs/crossfilter2/1.4.1/crossfilter.min",
		"director": "director.min",
		"search": "components/search",
		"configuration": "components/configuration",
		"source-manager": "components/source-manager",
		"concept-manager": "components/concept-manager",
		"conceptset-browser": "components/conceptset-browser",
		"conceptset-editor": "components/conceptset-editor",
		"conceptset-manager": "components/conceptset-manager",
		"cohort-comparison-manager": "components/cohort-comparison-manager",
		"job-manager": "components/job-manager",
		"data-sources": "components/data-sources",
		"cohort-definitions": "components/cohort-definitions",
		"cohort-definition-manager": "components/cohort-definition-manager",
		"cohort-definition-browser": "components/cohort-definition-browser",
		"cohort-comparison-browser": "components/cohort-comparison-browser",
		"cohort-comparison-print-friendly": "components/cohort-comparison-print-friendly",
		"cohort-comparison-r-code": "components/cohort-comparison-r-code",
		"cohort-comparison-multi-r-code": "components/cohort-comparison-multi-r-code",
		"user-bar": "components/user-bar",
		"report-manager": "components/report-manager",
		"ir-manager": "components/ir-manager",
		"ir-browser": "components/ir-browser",
		"faceted-datatable": "components/faceted-datatable",
		"profile-manager": "components/profile/profile-manager",
		"explore-cohort": "components/explore-cohort",
		"cohortcomparison": "modules/cohortcomparison",
		"r-manager": "components/r-manager",
		"negative-controls": "components/negative-controls",
		"atlascharts": "https://unpkg.com/@ohdsi/atlascharts@1.1.0/dist/atlascharts.min",
		"jnj_chart": "jnj.chart", // scatterplot is not ported to separate library
		"lodash": "lodash.4.15.0.full",
		"lscache": "lscache.min",
		"localStorageExtender": "localStorageExtender",
		"cohortbuilder": "modules/cohortbuilder",
		"conceptsetbuilder": "modules/conceptsetbuilder",
		"conceptpicker": "modules/conceptpicker",
		"webapi": "modules/WebAPIProvider",
		"vocabularyprovider": "modules/WebAPIProvider/VocabularyProvider",
		"appConfig": "config",
		"home": "components/home",
		"common": "components/datasources/app/common",
		"reports": "components/datasources/app/reports",
		"prism": "prism",
		"sptest": "sptest/sptest",
		"sptest_smoking": "sptest/sptest_smoking",
		"welcome": "components/welcome",
		"forbidden": "components/ac-forbidden",
		"unauthenticated": "components/ac-unauthenticated",
		"access-denied": "components/ac-access-denied",
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
	}
});

requirejs(['bootstrap'], function () { // bootstrap must come first
	requirejs(['knockout', 'app', 'appConfig', 'webapi/AuthAPI', 'webapi/SourceAPI', 'ohdsi.util', 'lscache', 'atlas-state', 'vocabularyprovider', 'director', 'search', 'localStorageExtender', 'jquery.ui.autocomplete.scroll', 'loading', 'user-bar', 'welcome'], function (ko, app, config, authApi, sourceApi, util, lscache, sharedState, vocabAPI) {
		var pageModel = new app();
		window.pageModel = pageModel;

		ko.applyBindings(pageModel, document.getElementsByTagName('html')[0]);

		// update access token
		if (authApi.token()) {
			var refreshTokenPromise = $.Deferred();
			pageModel.initPromises.push(refreshTokenPromise);
			authApi.refreshToken()
				.always(refreshTokenPromise.resolve);
		}

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
        authApi.token.subscribe(function(token) {
          if (token && !wasInitialized) {
            sourceApi.initSourcesConfig();
            wasInitialized = true;
          }
        });
      }
		}

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

		pageModel.loadIncluded = function () {
			pageModel.loadingIncluded(true);
			var includedPromise = $.Deferred();

			$.ajax({
				url: sharedState.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
				success: function (data) {
					var densityPromise = vocabAPI.loadDensity(data);

					$.when(densityPromise)
						.done(function () {
							pageModel.includedConcepts(data);
							includedPromise.resolve();
							pageModel.loadingIncluded(false);
						});
				}
			});

			return includedPromise;
		}

		pageModel.loadSourcecodes = function () {
			pageModel.loadingSourcecodes(true);

			// load mapped
			var identifiers = [];
			var concepts = pageModel.includedConcepts();
			for (var i = 0; i < concepts.length; i++) {
				identifiers.push(concepts[i].CONCEPT_ID);
			}

			return $.ajax({
				url: sharedState.vocabularyUrl() + 'lookup/mapped',
				method: 'POST',
				data: JSON.stringify(identifiers),
				contentType: 'application/json',
				success: function (sourcecodes) {
					pageModel.includedSourcecodes(sourcecodes);
					pageModel.loadingSourcecodes(false);
				}
			});
		}

		pageModel.currentConceptSetMode.subscribe(function (newMode) {
			switch (newMode) {
				case 'included':
					pageModel.loadIncluded();
					break;
				case 'sourcecodes':
					var includedPromise = pageModel.loadIncluded();
					$.when(includedPromise)
						.done(function () {
							pageModel.loadSourcecodes();
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
						return i.concept.CONCEPT_ID == concept.CONCEPT_ID;
					});
				}

				// If we are updating a concept set that is part of a cohort definition
				// then we need to notify any dependent observables about this change in the concept set
				if (pageModel.currentCohortDefinition() && pageModel.currentConceptSetSource() == "cohort") {
					var conceptSet = pageModel.currentCohortDefinition()
						.expression()
						.ConceptSets()
						.filter(function (item) {
							return item.id == pageModel.currentConceptSet()
								.id
						})[0];
					conceptSet.expression.items.valueHasMutated();
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
