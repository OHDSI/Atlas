define(['knockout', 'lscache', 'services/job/jobDetail', 'assets/ohdsi.util', 'const'], function (ko, cache, jobDetail, ohdsiUtil, constants) {
	var state = {};
	state.jobListing = ko.observableArray();
	state.priorityScope = ko.observable('session');
	state.roles = ko.observableArray();
	state.users = ko.observableArray();
	state.sources = ko.observableArray([]);
	state.currentView = ko.observable('loading');
	state.loading = ko.observable(false);

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
		selectedId: ko.observable(null),
		selectedSourceId: ko.observable(null),
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

	state.ConfigurationSource = {
		current: ko.observable(null),
		selectedId: ko.observable(null),
	}
	state.ConfigurationSource.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.ConfigurationSource.current()));


	state.criteriaContext = ko.observable();

	state.includedConcepts = ko.observableArray([]);
	state.currentIncludedConceptIdentifierList = ko.observable();
	state.conceptSetInclusionIdentifiers = ko.observableArray([]);

	state.loadingSourcecodes = ko.observable(false);
	state.loadingIncluded = ko.observable(false);
	state.includedConceptsMap = ko.observable({});
	state.includedSourcecodes = ko.observableArray();
	state.currentConceptSetMode = ko.observable('details');
	state.includedHash = ko.observable();

	state.ConceptSet = {
		current: ko.observable(),
		source: ko.observable(),
		negativeControls: ko.observable(),
	};
	state.ConceptSet.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag({
		header: state.ConceptSet.current,
		details: state.selectedConcepts,
	}));
	state.ConceptSet.current.subscribe((newValue) => {
		if (newValue != null) {
			state.ConceptSet.dirtyFlag(new ohdsiUtil.dirtyFlag({
				header: state.ConceptSet.current,
				details: state.selectedConcepts,
			}));
		}
	});

	state.currentConceptIdentifierList = ko.observable();
	state.resolvingConceptSetExpression = ko.observable(false);
	state.currentConceptSetExpressionJson = ko.observable();

	state.CohortDefinition = {
		current: ko.observable(null),
		info: ko.observable(),
		mode: ko.observable('definition'),
		sourceInfo: ko.observableArray(),
		lastUpdatedId: ko.observable(),
	};
	state.CohortDefinition.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(state.CohortDefinition.current()));
	state.CohortDefinition.current.subscribe(newValue => {
		if (newValue != null) {
			state.CohortDefinition.dirtyFlag(new ohdsiUtil.dirtyFlag(state.CohortDefinition.current()));
		}
	});
	state.cohortDefinitions = ko.observableArray();


	return state;
});