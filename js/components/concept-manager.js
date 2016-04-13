define(['knockout', 'text!./concept-manager.html', 'appConfig', 'faceted-datatable'], function (ko, view, config) {
	function conceptManager(params) {
		var self = this;
		self.model = params.model;
		self.sourceCounts = ko.observableArray();
		self.loadingSourceCounts = ko.observable(false);

		self.currentConceptId = params.currentConceptId;

		self.currentConceptId.subscribe(function (value) {
			if (self.model.currentConceptMode() == 'recordcounts') {
				self.loadRecordCounts();
			}
		});

		self.model.currentConceptMode.subscribe(function (mode) {
			switch (mode) {
			case 'recordcounts':
				self.loadRecordCounts();
				break;
			}
		});

		self.loadRecordCounts = function () {
			self.loadingSourceCounts(true);
			var sources = config.services[0].sources;

			var allCounts = $.Deferred();
			var totalCounts = 0;
			var completedCounts = 0;
			var sourceData = [];

			for (var i = 0; i < sources.length; i++) {
				if (sources[i].hasResults) {
					totalCounts++;
				}
			};

			for (var i = 0; i < sources.length; i++) {
				if (sources[i].hasResults) {
					var source = sources[i];
					$.ajax({
						url: source.resultsUrl + 'conceptRecordCount',
						method: 'POST',
						source: source,
						contentType: 'application/json',
						data: JSON.stringify([self.currentConceptId()]),
						success: function (data) {
							completedCounts++;
							sourceData.push({
								sourceName: this.source.sourceName,
								recordCount: data[0].value[0],
								descendantRecordCount: data[0].value[1]
							});

							if (completedCounts == totalCounts) {
								allCounts.resolve();
							}
						},
						error: function (data) {
							completedCounts++;

							if (completedCounts == totalCounts) {
								allCounts.resolve();
							}
						}
					});
				}
			}

			$.when(allCounts).done(function () {
				self.loadingSourceCounts(false);
				self.sourceCounts(sourceData);
			});
		}
	}

	var component = {
		viewModel: conceptManager,
		template: view
	};

	ko.components.register('concept-manager', component);
	return component;
});
