define(['knockout', 'text!./feasibility-analyzer.html'], function (ko, view) {
	function feasibilityAnalyzer(params) {
		var self = this;

		self.feasibilityId = params.feasibilityId;
		self.services = params.services;
		self.feasibility = ko.observable();
		self.loading = ko.observable(false);
		self.sources = ko.observableArray();
		self.report = ko.observable();
		self.isNoData = ko.observable(false);
		self.results = {};

		self.lookupCount = function (inclusionRuleIndex, sourceKey) {
			return self.results[sourceKey].inclusionRuleStats[inclusionRuleIndex].countSatisfying;
		};
		self.lookupPercentage = function (inclusionRuleIndex, sourceKey) {
			return self.results[sourceKey].inclusionRuleStats[inclusionRuleIndex].percentSatisfying;
		};
		self.lookupTotal = function (sourceKey) {
			return self.results[sourceKey].summary.totalPersons;
		};

		self.loadFeasibility = function (id) {
			self.loading(true);

			$.ajax({
				url: self.services()[0].url + 'feasibility/' + id,
				success: function (f) {
					self.feasibility(f);
				}
			});

			var dataPromise = $.Deferred();

			$.ajax({
				url: self.services()[0].url + 'feasibility/' + id + '/info',
				success: function (fi) {
					if (fi.length == 0) {
						// nothing processed
						self.isNoData(true);
						self.loading(false);
						return;
					}
					
					var dataCount = 0;
					for (var i = 0; i < fi.length; i++) {
						var source = self.getSource(fi[i].generationInfo.id.sourceId);
						self.sources.push(source);
						$.ajax({
							source: source,
							url: self.services()[0].url + 'feasibility/' + id + '/report/' + source.sourceKey,
							success: function (data) {
								dataCount++;
								self.results[this.source.sourceKey] = data;
								if (dataCount == fi.length) {
									dataPromise.resolve();
								}
							}
						});
					}
				}
			});

			$.when(dataPromise).done(function () {
				self.loading(false);
				self.report(self.results);
			});
		}

		// handle race condition
		if (self.feasibilityId()) {
			self.loadFeasibility(self.feasibilityId());
		}

		self.feasibilityId.subscribe(function (d) {
			self.loadFeasibility(d);
		});

		self.getSource = function (sourceId) {
			for (var i = 0; i < self.services()[0].sources.length; i++) {
				if (self.services()[0].sources[i].sourceId == sourceId) {
					return self.services()[0].sources[i];
				}
			}
		}
	}

	var component = {
		viewModel: feasibilityAnalyzer,
		template: view
	};

	ko.components.register('feasibility-analyzer', component);
	return component;
});