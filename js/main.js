requirejs.config({
	urlArgs: "bust=" + (new Date()).getTime(),
	baseUrl: 'js',
	config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				return true;
			}
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
		"jquery": "https://code.jquery.com/jquery-1.11.2.min",
		"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min",
		"text": "plugins/text",
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
		"profile-manager": "components/profile-manager",
		"d3": "d3.min",
		"d3_tip": "d3.tip",
		"jnj_chart": "jnj.chart",
		"lodash": "lodash.min"
	}
});

requirejs(['knockout', 'app', 'director','search'], function (ko, app) {
	
	$('#splash').fadeIn();
	var pageModel = new app();
	window.pageModel = pageModel;
	ko.applyBindings(pageModel);			
	
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

	$(document).on('click', 'td i.fa.fa-shopping-cart, .wrapperTitle i.fa.fa-shopping-cart', function () {
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

});
