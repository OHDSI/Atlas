define(['knockout', 'lscache', 'services/job/jobDetail', 'assets/ohdsi.util', 'const'], function (ko, cache, jobDetail, ohdsiUtil, constants) {
	var state = {};
	state.jobListing = ko.observableArray();
	state.priorityScope = ko.observable('session');
	state.roles = ko.observableArray();
	state.sources = ko.observableArray([]);

	const updateKey = (key, value) => value ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key);
	state.vocabularyUrl = ko.observable(sessionStorage.vocabularyUrl);
	state.evidenceUrl = ko.observable(sessionStorage.evidenceUrl);
	state.resultsUrl = ko.observable(sessionStorage.resultsUrl);
	state.vocabularyUrl.subscribe(value => updateKey('vocabularyUrl', value));
	state.evidenceUrl.subscribe(value => updateKey('evidenceUrl', value));
	state.resultsUrl.subscribe(value => updateKey('resultsUrl', value));

	// This default values are stored during initialization
	// and used to reset after session finished
	state.defaultVocabularyUrl = ko.observable();
	state.defaultEvidenceUrl = ko.observable();
	state.defaultResultsUrl = ko.observable();
	state.defaultVocabularyUrl.subscribe((value) => state.vocabularyUrl(value));
	state.defaultEvidenceUrl.subscribe((value) => state.evidenceUrl(value));
	state.defaultResultsUrl.subscribe((value) => state.resultsUrl(value));

	state.resetCurrentDataSourceScope = function() {
		state.vocabularyUrl(state.defaultVocabularyUrl());
		state.evidenceUrl(state.defaultEvidenceUrl());
		state.resultsUrl(state.defaultResultsUrl());
	}

	state.sourceKeyOfVocabUrl = ko.computed(() => {
		return state.vocabularyUrl() ? state.vocabularyUrl().replace(/\/$/, '').split('/').pop() : null;
	});

	// shared concept selection state
	state.selectedConceptsIndex = {};
	state.selectedConcepts = ko.observableArray(null);
	state.conceptSetExpression = ko.pureComputed(() => {
		return { "items": state.selectedConcepts() };
	});
	state.appInitializationStatus = ko.observable(constants.applicationStatuses.initializing);

	state.clearSelectedConcepts = function () {
		this.selectedConceptsIndex = {};
		this.selectedConcepts([]);
	}
	
	state.IRAnalysis = {
		current: ko.observable(null),
		selectedId: ko.observable(null)
	}
	state.IRAnalysis.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.IRAnalysis.current()));

	//Cohort characterizations
	state.CohortCharacterization = {
		current: ko.observable(null),
		selectedId: ko.observable(null),
	};
	state.CohortCharacterization.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.CohortCharacterization.current()));

	state.FeatureAnalysis = {
		current: ko.observable(null),
		selectedId: ko.observable(null),
	};
	state.FeatureAnalysis.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.FeatureAnalysis.current()));

	// Pathways State
	state.CohortPathways = {
		current: ko.observable(null),
		selectedId: ko.observable(null)
	};	
	state.CohortPathways.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.CohortPathways.current()));
	
	
	state.estimationAnalysis = {
		current: ko.observable(null),
		analysisPath: null,
		selectedId: ko.observable(null),
		comparisons: ko.observableArray(),
	}
	state.estimationAnalysis.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.estimationAnalysis.current()));

	state.predictionAnalysis = {
		current: ko.observable(null),
		analysisPath: null,
		selectedId: ko.observable(null),
		targetCohorts: ko.observableArray(),
		outcomeCohorts: ko.observableArray(), 
	}
	state.predictionAnalysis.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.predictionAnalysis.current()));

	return state;
});