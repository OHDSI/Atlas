define(['knockout', 'text!./cohort-definitions.html', 'appConfig', 'knockout.dataTables.binding', 'faceted-datatable'], function (ko, view, config) {
	function cohortDefinitions(params) {
		var self = this;
		self.model = params.model;
		self.cohortDefinitionId = ko.observable();
		self.cohortDefinitionId.extend({
			notify: 'always'
		});

		self.cohortDefinitionId.subscribe(function (d) {
			document.location = "#/cohortdefinition/" + d;
		});

		self.newDefinition = function (data, event) {
			self.cohortDefinitionId('0');
		}
	}

	var component = {
		viewModel: cohortDefinitions,
		template: view
	};

	ko.components.register('cohort-definitions', component);
	return component;
});
