define(function (require, exports) {

	var ko = require('knockout');

	function FeatureSection(sectionName) {
		var self = this;

		self.type = sectionName;
		self.data = ko.observableArray(null);
		self.dataLoaded = ko.observable(false);
		self.loadingFlag = ko.observable(true);
		self.dataFiltered = ko.observableArray(null);
		self.byCovariate = new Map();
		self.filteredFlag = ko.observable(false);
		self.currentFilter = ko.observable(null);
	}

	return FeatureSection;
});
