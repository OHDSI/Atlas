requirejs.config({
	//waitSeconds: 60, // FOR DEVELOPMENT, REMOVE WHEN NOT NEEDED? default is 7
	//urlArgs: "bust=" + (new Date()).getTime(),
	baseUrl: 'js',
	config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				return true;
			}
		}
	},
	packages: [
		{
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
        }        
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
        "prism" :{
            "prism": {
                "exports": "Prism"
            }
        }
	},
	map: {
		"*": {
			'jquery-ui/sortable': 'jquery-ui',
			'jquery-ui/draggable': 'jquery-ui',
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
		"knockout": "knockout.min",
		"ko.sortable": "https://cdnjs.cloudflare.com/ajax/libs/knockout-sortable/0.11.0/knockout-sortable",
		"knockout-mapping": "knockout.mapping",
		"knockout-persist": "knockout.persist",
    "knockout-amd-helpers": "knockout-amd-helpers.min",
		"datatables.net": "jquery.dataTables.min",
		"datatables.net-buttons" : "jquery.dataTables.buttons.min",
		"datatables.net-buttons-html5" : "jquery.dataTables.buttons.html5.min",
		"colvis": "jquery.dataTables.colVis.min",
		"director": "director.min",
		"search": "components/search",
		"configuration": "components/configuration",
		"concept-manager": "components/concept-manager",
		"conceptset-browser": "components/conceptset-browser",
		"conceptset-editor": "components/conceptset-editor",
		"conceptset-manager": "components/conceptset-manager",
		"cohort-comparison-manager": "components/cohort-comparison-manager",
		"job-manager": "components/job-manager",
		"importer": "components/importer",
		"data-sources": "components/data-sources",
		"cohort-definitions": "components/cohort-definitions",
		"cohort-definition-manager": "components/cohort-definition-manager",
		"cohort-definition-browser": "components/cohort-definition-browser",
		"cohort-comparison-browser": "components/cohort-comparison-browser",
		"cohort-comparison-print-friendly": "components/cohort-comparison-print-friendly",
		"cohort-comparison-r-code": "components/cohort-comparison-r-code",
		"feasibility-manager": "components/feasibility-manager",
		"feasibility-browser": "components/feasibility-browser",
		"feasibility-analyzer": "components/feasibility-analyzer",
		"report-manager": "components/report-manager",
		"ir-manager": "components/ir-manager",
        "ir-browser": "components/ir-browser",
		"faceted-datatable": "components/faceted-datatable",
		"profile-manager": "components/profile-manager",
		"explore-cohort": "components/explore-cohort",
		"cohortcomparison": "modules/cohortcomparison",
		"r-manager": "components/r-manager",
        "negative-controls": "components/negative-controls",
		"d3": "d3.min",
		"d3_tip": "d3.tip",
		"jnj_chart": "jnj.chart",
		"nvd3":"nv.d3",
		//"lodash": "lodash.min",
		"lodash": "lodash.4.15.0.full",
		"lscache": "lscache.min",
		"localStorageExtender": "localStorageExtender",
		"cohortbuilder": "modules/cohortbuilder",
		"conceptsetbuilder": "modules/conceptsetbuilder",
		"conceptpicker": "modules/conceptpicker",
		"webapi": "modules/WebAPIProvider",
		"vocabularyprovider": "modules/WebAPIProvider/VocabularyProvider",
		"appConfig": "config",
		"home" : "components/home",
		"common":"components/datasources/app/common",
		"reports": "components/datasources/app/reports",
		"prism": "prism",
		"sptest": "sptest/sptest",
		"sptest_smoking": "sptest/sptest_smoking",
        "welcome": "components/welcome"
	}
});

requirejs(['bootstrap'], function () { // bootstrap must come first
	requirejs(['knockout', 'app', 'appConfig', 'ohdsi.util', 'director', 'search', 'localStorageExtender', 'jquery.ui.autocomplete.scroll'], function (ko, app, config, util) {
		$('#splash').fadeIn();
		var pageModel = new app();
		window.pageModel = pageModel;
		ko.applyBindings(pageModel,document.getElementsByTagName('html')[0]);

		// establish base priorities for daimons
		var evidencePriority = 0;
		var vocabularyPriority = 0;
		var densityPriority = 0;

		// initialize all service information asynchronously
		$.each(config.services, function (serviceIndex, service) {
			service.sources = [];
			var servicePromise = $.Deferred();
			pageModel.initPromises.push(servicePromise);

			util.cachedAjax({
				url: service.url + 'source/sources',
				method: 'GET',
				contentType: 'application/json',
				success: function (sources) {
					service.available = true;
					var completedSources = 0;

					$.each(sources, function (sourceIndex, source) {
						source.hasVocabulary = false;
						source.hasEvidence = false;
						source.hasResults = false;
						source.hasCDM = false;
						source.vocabularyUrl = '';
						source.evidenceUrl = '';
						source.resultsUrl = '';
						source.error = '';

						source.initialized = true;
						for (var d = 0; d < source.daimons.length; d++) {
							var daimon = source.daimons[d];

							// evaluate vocabulary daimons
							if (daimon.daimonType == 'Vocabulary') {
								source.hasVocabulary = true;
								source.vocabularyUrl = service.url + source.sourceKey + '/vocabulary/';
								if (daimon.priority >= vocabularyPriority) {
									vocabularyPriority = daimon.priority;
									pageModel.vocabularyUrl(source.vocabularyUrl);
								}
							}

							// evaluate evidence daimons
							if (daimon.daimonType == 'Evidence') {
								source.hasEvidence = true;
								source.evidenceUrl = service.url + source.sourceKey + '/evidence/';
								if (daimon.priority >= evidencePriority) {
									evidencePriority = daimon.priority;
									pageModel.evidenceUrl(source.evidenceUrl);
								}
							}

							// evaluate results daimons
							if (daimon.daimonType == 'Results') {
								source.hasResults = true;
								source.resultsUrl = service.url + source.sourceKey + '/cdmresults/';
								if (daimon.priority >= densityPriority) {
									densityPriority = daimon.priority;
									pageModel.resultsUrl(source.resultsUrl);
								}
							}

							// evaluate cdm daimons
							if (daimon.daimonType == 'CDM') {
								source.hasCDM = true;
							}
						}

						service.sources.push(source);

						if (source.hasVocabulary) {
							util.cachedAjax({
								url: service.url + source.sourceKey + '/vocabulary/info',
								timeout: 20000,
								method: 'GET',
								contentType: 'application/json',
								success: function (info) {
									completedSources++;
									source.version = info.version;
									source.dialect = info.dialect;

									if (completedSources == sources.length) {
										servicePromise.resolve();
									}
								},
								error: function (err) {
									completedSources++;
									pageModel.initializationErrors++;
									source.version = 'unknown';
									source.dialect = 'unknown';
									source.url = service.url + source.sourceKey + '/';
									if (completedSources == sources.length) {
										servicePromise.resolve();
									}
								}
							});
						} else {
							completedSources++;
							source.version = 'not available'
							if (completedSources == sources.length) {
								servicePromise.resolve();
							}
						}
					});
				},
				error: function (xhr, ajaxOptions, thrownError) {
					service.available = false;
					service.xhr = xhr;
					service.thrownError = thrownError;

					pageModel.appInitializationFailed(true);
					pageModel.currentView('configure');

					servicePromise.resolve();
				}
			});
		});

		$.when.apply($, pageModel.initPromises).done(function () {
			pageModel.initComplete();
		});

		pageModel.currentView.subscribe(function (newView) {
			if (newView != 'splash') {
				$('#splash').hide();
			}

			switch (newView) {
			case 'splash':
				// switching back to atlas splash for activity view
				$('#splash').show();
				break;
			case 'reports':
				$.ajax({
					url: config.services[0].url + 'cohortdefinition',
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
				url: pageModel.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
				success: function (data) {
					var densityPromise = pageModel.loadDensity(data);

					$.when(densityPromise).done(function () {
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
				url: pageModel.vocabularyUrl() + 'lookup/mapped',
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
				$.when(includedPromise).done(function () {
					pageModel.loadSourcecodes();
				});
				break;
			}
		});

		// handle select all
		$(document).on('click', 'th i.fa.fa-shopping-cart', function () {
			if (pageModel.currentConceptSet() == undefined) {
				var newConceptSet = {
					name: ko.observable("New Concept Set"),
					id: 0
				}
			}

			var table = $(this).closest('.dataTable').DataTable();
			var concepts = table.rows({
				search: 'applied'
			}).data();
			var selectedConcepts = pageModel.selectedConcepts();

			for (var i = 0; i < concepts.length; i++) {
				var concept = concepts[i];
				if (pageModel.selectedConceptsIndex[concept.CONCEPT_ID]) {
					// ignore if already selected
				} else {
					var conceptSetItem = pageModel.createConceptSetItem(concept);
					pageModel.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
					selectedConcepts.push(conceptSetItem)
				}
			}
			pageModel.selectedConcepts(selectedConcepts);
			ko.contextFor(this).$component.reference.valueHasMutated();
		});

		// handling concept set selections
		$(document).on('click', 'td i.fa.fa-shopping-cart, .asset-heading i.fa.fa-shopping-cart', function () {
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

			$(this).toggleClass('selected');
			var concept = ko.contextFor(this).$data;

			if ($(this).hasClass('selected')) {
				var conceptSetItem = pageModel.createConceptSetItem(concept);
				pageModel.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
				pageModel.selectedConcepts.push(conceptSetItem);
			} else {
				delete pageModel.selectedConceptsIndex[concept.CONCEPT_ID];
				pageModel.selectedConcepts.remove(function (i) {
					return i.concept.CONCEPT_ID == concept.CONCEPT_ID;
				});
			}

			pageModel.analyzeSelectedConcepts();

			// If we are updating a concept set that is part of a cohort definition
			// then we need to notify any dependent observables about this change in the concept set
			if (pageModel.currentCohortDefinition() && pageModel.currentConceptSetSource() == "cohort") {
				var conceptSet = pageModel.currentCohortDefinition().expression().ConceptSets().filter(function (item) {
					return item.id == pageModel.currentConceptSet().id
				})[0];
				conceptSet.expression.items.valueHasMutated();
			}
		});

		// concept set selector handling
		$(document).on('click', '.conceptSetTable i.fa.fa-shopping-cart', function () {
			$(this).toggleClass('selected');
			var conceptSetItem = ko.contextFor(this).$data;

			delete pageModel.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID];
			pageModel.selectedConcepts.remove(function (i) {
				return i.concept.CONCEPT_ID == conceptSetItem.concept.CONCEPT_ID;
			});

			pageModel.resolveConceptSetExpression();
			pageModel.analyzeSelectedConcepts();
		});
		
		$(window).bind('beforeunload', function () {
			if (pageModel.hasUnsavedChanges())
				return "Changes will be lost if you do not save.";
		});		
	});
});
