requirejs.config({
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
		"datatables": "jquery.dataTables.min",
		"colvis": "jquery.DataTables.colVis.min",
		"director": "director.min",
		"search": "components/search",
		"configuration": "components/configuration",
		"concept-manager": "components/concept-manager",
		"conceptset-manager": "components/conceptset-manager",
		"job-manager": "components/job-manager",
		"importer": "components/importer",
		"cohort-definitions": "components/cohort-definitions",
		"cohort-definition-manager": "components/cohort-definition-manager",
		"report-manager": "components/report-manager",
		"analytics-manager": "components/analytics-manager",
		"faceted-datatable": "components/faceted-datatable",
		"jnj_chart" : "jnj.chart",
		"d3": "d3.min",
		"d3_tip" : "d3.tip",
		"lodash" : "lodash.min"
	}
});

requirejs(['knockout', 'app', 'director', 'search',
					 "configuration",
					 "concept-manager",
					 "conceptset-manager",
					 "job-manager",
					 "importer",
					 "cohort-definitions",
					 "cohort-definition-manager",
					 "report-manager",
					 "analytics-manager",
					 "faceted-datatable"
				], function (ko, app) {
	$('#splash').fadeIn();

	var pageModel = new app();

	var routerOptions = {
		notfound: function () {
			pageModel.currentView('search');
		}
	}

	var routes = {
		'/concept/:conceptId:': function (conceptId) {
			pageModel.currentConceptId(conceptId);
			pageModel.loadConcept(conceptId);
		},
		'/cohortdefinitions': function () {
			pageModel.currentView('cohortdefinitions');
		},
		'/configure': function () {
			pageModel.currentView('configure');
		},
		'/jobs': function () {
			pageModel.currentView('loading');
			pageModel.loadJobs();
		},
		'reports': function () {
			pageModel.currentView('reports');
		},
		'import': function () {
			pageModel.currentView('import');
		},
		'conceptset': function () {
			pageModel.currentView('conceptset');
		},
		'analytics': function () {
			pageModel.currentView('analytics');
		},
		'splash': function () {
			pageModel.currentView('splash');
		},
		'/cohortdefinition/:cohortDefinitionId:': pageModel.loadCohortDefinition,
		'/search/:query:': pageModel.search,
		'/search': function () {
			pageModel.currentView('search');
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
		case 'cohortdefinitions':
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
			$.ajax({
				url: pageModel.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
				success: function (data) {
					pageModel.includedConcepts(data);
				}
			});
			break;
		case 'analysis':
			$.ajax({
				url: pageModel.resultsUrl() + 'conceptRecordCount',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(pageModel.conceptSetInclusionIdentifiers()),
				success: function (root) {
					var ph = new packingHierarchy();
					ph.render('#wrapperAnalysisVisualization', root);
				}
			});
			break;
		}
	});

	// handle selections with shopping cart icon
	$(document).on('click', '.wrapperTitle .fa-shopping-cart, .conceptTable i.fa.fa-shopping-cart', function () {

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
