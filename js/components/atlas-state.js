define(['knockout', 'lscache'], function (ko, cache) {
	var state = {};
	state.resultsUrl = ko.observable();
	state.vocabularyUrl = ko.observable();
	state.evidenceUrl = ko.observable();

	// job listing notification management
	var jobListingCacheKey = "atlas:jobListing";
	var jobListingCache = cache.get(jobListingCacheKey);
	if (jobListingCache) {
		state.jobListing = ko.observableArray(jobListingCache);
		state.jobListing().forEach(j => {
			j.progress = ko.observable(j.progress);
			j.status = ko.observable(j.status);
			j.viewed = ko.observable(j.viewed);
		})
	} else {
		state.jobListing = ko.observableArray();
	}

	state.jobListing.subscribe(function (data) {
		cache.set(jobListingCacheKey, ko.toJSON(data));
	});

	// shared concept selection state
	state.selectedConceptsIndex = {};
	state.selectedConcepts = ko.observableArray(null);
	state.appInitializationStatus = ko.observable('initializing');

	state.clearSelectedConcepts = function () {
		this.selectedConceptsIndex = {};
		this.selectedConcepts([]);
	}

	return state;
});