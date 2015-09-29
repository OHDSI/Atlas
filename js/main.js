requirejs.config({
	urlArgs: "bust=" + (new Date()).getTime(),
	baseUrl: 'js',
	map: {
		'*': {
			'css': 'plugins/css.min',
			'text': 'plugins/text'
		}
	},
	shim: {
		"colorbrewer": {
			exports: 'colorbrewer'
		},
		"bootstrap": {
			"deps": [
				'jquery',
			]
		},
		"facets": {
			"deps": ['jquery'],
			exports: 'FacetEngine'
		}
	},
	paths: {
		"jquery": "http://code.jquery.com/jquery-1.11.2.min",
		"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min",
		"knockout": "knockout.min",
		"knockout-mapping": "knockout.mapping",
		"knockout-persist": "knockout.persist",
		"datatables": "jquery.dataTables.min",
		"colvis": "jquery.dataTables.colVis.min",
		"director": "director.min",
		"search": "components/search",
		"configuration": "components/configuration",
		"concept-manager": "components/concept-manager",
		"conceptset-manager": "components/conceptset-manager",
		"job-manager": "components/job-manager",
		"importer": "components/importer",
		"cohort-definitions": "components/cohort-definitions",
		"cohort-definition-manager": "components/cohort-definition-manager",
		"cohort-definition-browser": "components/cohort-definition-browser",
		"feasibility-manager": "components/feasibility-manager",
		"feasibility-browser": "components/feasibility-browser",
		"feasibility-analyzer": "components/feasibility-analyzer",
		"report-manager": "components/report-manager",
		"analytics-manager": "components/analytics-manager",
		"faceted-datatable": "components/faceted-datatable",
		"d3": "d3.min",
		"d3_tip": "d3.tip",
		"jnj_chart": "jnj.chart",
		"lodash": "lodash.min",
		"packinghierarchy": "visualization.packinghierarchy",
		"forcedirectedgraph": "visualization.forcedirectedgraph",
		"kerneldensity": "visualization.kerneldensity"
	}
});

// todo - remove overall requirements and move to route based lazy loaded requires
requirejs(['knockout', 'app', 'packinghierarchy', 'forcedirectedgraph', 'kerneldensity',
					 'director',
					 "concept-manager",
					 "conceptset-manager",
					 "cohort-definitions",
					 "cohort-definition-manager",
					 "cohort-definition-browser",
					 "analytics-manager",
					 "faceted-datatable"
				], function (ko, app, visualizations, fdg, kd) {
	$('#splash').fadeIn();

	var pageModel = new app();

	var routerOptions = {
		notfound: function () {
			pageModel.currentView('search');
		}
	}

	var routes = {
		'/': function () {
			// default to search for now
			document.location = "#/search";
		},
		'/concept/:conceptId:': function (conceptId) {
			pageModel.currentConceptId(conceptId);
			pageModel.loadConcept(conceptId);
		},
		'/cohortdefinitions': function () {
			pageModel.currentView('cohortdefinitions');
		},
		'/configure': function () {
			require(['configuration'], function () {
				pageModel.currentView('configure');
			});
		},
		'/jobs': function () {
			require(['job-manager'], function () {
				pageModel.currentView('loading');
				pageModel.loadJobs();
			});
		},
		'reports': function () {
			require(['report-manager'], function () {
				pageModel.currentView('reports');
			});
		},
		'import': function () {
			require(['importer'], function () {
				pageModel.currentView('import');
			});
		},
		'conceptset': function () {
			pageModel.currentConceptSetMode('details');
			pageModel.currentView('conceptset');
		},
		'conceptset/:conceptSetId': pageModel.loadConceptSet,
		'analytics': function () {
			pageModel.currentView('analytics');
		},
		'splash': function () {
			pageModel.currentView('splash');
		},
		'/cohortdefinition/:cohortDefinitionId:': function (cohortDefinitionId) {
			require([''], function () {
				pageModel.loadCohortDefinition(cohortDefinitionId)
			});
		},
		'/search/:query:': function (query) {
			require(['search'], function () {
				pageModel.currentView('search');
				pageModel.currentSearch(query);
			});
		},
		'/search': function () {
			require(['search'], function () {
				pageModel.currentView('search');
			});
		},
		'/feasibility': function () {
			require(['feasibility-manager', 'feasibility-browser'], function () {
				pageModel.currentView('feasibilities');
			});
		},
		'/feasibility/:feasibilityId:': function (feasibilityId) {
			require(['feasibility-analyzer'], function () {
				pageModel.currentView('feasibility');
				pageModel.feasibilityId(feasibilityId);
			});
		},
		'/template': function () {
			pageModel.currentView('template');
			$.ajax({
				url: pageModel.services()[0].url + 'OPTUM/cohortresults/44/experimentalCovariates',
				success: function (covariates) {
					kd.kernelDensity('#kernelDensityContainer', covariates);
				}
			});

		}
	}

	pageModel.router = new Router(routes).configure(routerOptions);
	window.pageModel = pageModel;

	pageModel.currentView.subscribe(function (newView) {
		if (newView != 'splash') {
			$('#splash').hide();
		}

		switch (newView) {
		case 'splash':
			// switching back to atlas splash for activity view
			$('#splash').show();
			break;
		case 'conceptset':
			pageModel.resolveConceptSetExpression();

			var identifiers = [];
			for (var c = 0; c < pageModel.selectedConcepts().length; c++) {
				identifiers.push(pageModel.selectedConcepts()[c].concept.CONCEPT_ID);
			}
			pageModel.currentConceptIdentifierList(identifiers.join(','));

			break;
		case 'reports':
			$.ajax({
				url: pageModel.services()[0].url + 'cohortdefinition',
				method: 'GET',
				contentType: 'application/json',
				success: function (cohortDefinitions) {
					pageModel.cohortDefinitions(cohortDefinitions);
				}
			});
			break;
		}
	});

	pageModel.currentConceptSetMode.subscribe(function (newMode) {
		switch (newMode) {
		case 'included':
			pageModel.loadingIncluded(true);
			$.ajax({
				url: pageModel.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
				success: function (data) {
					var densityPromise = pageModel.loadDensity(data);

					$.when(densityPromise).done(function () {
						pageModel.includedConcepts(data);
						pageModel.loadingIncluded(false);
					});
				}
			});
			break;
		case 'analysis':
			if (pageModel.conceptSetInclusionIdentifiers().length > 0) {
				$.ajax({
					url: pageModel.resultsUrl() + 'denseSiblings',
					method: 'POST',
					contentType: 'application/json',
					data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
					success: function (denseConcepts) {
						var densityPromise = pageModel.loadDensity(denseConcepts);

						$.when(densityPromise).done(function () {
							pageModel.denseSiblings(denseConcepts);
						});
					}
				});
			}
			break;
		case 'sourcecodes':
			pageModel.loadingSourcecodes(true);
			// load mapped
			var identifiers = [];
			var concepts = pageModel.selectedConcepts();
			for (var i=0; i<concepts.length; i++) {
				identifiers.push(concepts[i].concept.CONCEPT_ID);
			}

			$.ajax({
				url: pageModel.vocabularyUrl() + 'lookup/mapped',
				method: 'POST',
				data: JSON.stringify(identifiers),
				contentType: 'application/json',
				success: function (sourcecodes) {
					pageModel.includedSourcecodes(sourcecodes);
					pageModel.loadingSourcecodes(false);
				}
			});
			break;
		}
	});

	// handle select all 
	$(document).on('click', 'th i.fa.fa-shopping-cart', function () {
		var table = $(this).closest('.dataTable').DataTable();
		var concepts = table.rows({
			search: 'applied'
		}).data();
		var selectedConcepts = pageModel.selectedConcepts();

		for (var i = 0; i < concepts.length; i++) {
			var concept = concepts[i];
			if (pageModel.selectedConceptsIndex[concept.CONCEPT_ID]) {
				// ignore if already selected

				/*
				delete pageModel.selectedConceptsIndex[concept.CONCEPT_ID];
				pageModel.selectedConcepts.remove(function (i) {
					return i.concept.CONCEPT_ID == concept.CONCEPT_ID;
				});
				*/
			} else {
				var conceptSetItem = pageModel.createConceptSetItem(concept);
				pageModel.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
				selectedConcepts.push(conceptSetItem)
			}
		}
		pageModel.selectedConcepts(selectedConcepts);
		ko.contextFor(this).$component.reference.valueHasMutated();
	});

	$(document).on('click', 'td i.fa.fa-shopping-cart', function () {
		$(this).toggleClass('selected');
		var concept = ko.contextFor(this).$data;

		if ($(this).hasClass('selected')) {
			var conceptSetItem = pageModel.createConceptSetItem(concept);
			pageModel.selectedConcepts.push(conceptSetItem);
			pageModel.selectedConceptsIndex[concept.CONCEPT_ID] = 1;
		} else {
			delete pageModel.selectedConceptsIndex[concept.CONCEPT_ID];
			pageModel.selectedConcepts.remove(function (i) {
				return i.concept.CONCEPT_ID == concept.CONCEPT_ID;
			});
		}

		pageModel.analyzeSelectedConcepts();
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

	// establish base priorities for daimons
	var evidencePriority = 0;
	var vocabularyPriority = 0;
	var densityPriority = 0;

	// initialize all service information asynchronously
	$.each(pageModel.services(), function (serviceIndex, service) {
		service.sources = [];
		var servicePromise = $.Deferred();
		pageModel.initPromises.push(servicePromise);

		$.ajax({
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
					}

					service.sources.push(source);

					$.ajax({
						url: service.url + source.sourceKey + '/vocabulary/info',
						timeout: 5000,
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
							source.initialized = false;
							pageModel.initializationErrors++;
							source.error = err.statusText;
							source.version = 'unknown';
							source.dialect = 'unknown';
							source.url = service.url + source.sourceKey + '/';
							if (completedSources == sources.length) {
								servicePromise.resolve();
							}
						}
					});
				});
			},
			error: function (xhr, ajaxOptions, thrownError) {
				service.available = false;
				service.xhr = xhr;
				service.thrownError = thrownError;
				servicePromise.resolve();

				pageModel.appInitializationFailed(true);
				pageModel.currentView('configure');
			}
		});
	});

	$.when.apply($, pageModel.initPromises).done(pageModel.initComplete);
	ko.applyBindings(pageModel);
});
