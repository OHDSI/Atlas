define(['knockout', 'text!./cohort-definitions.html', 'appConfig', 'webapi/AuthAPI', 'knockout.dataTables.binding', 'faceted-datatable', 'access-denied'], function (ko, view, config, authApi) {
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

		self.isAuthenticated = authApi.isAuthenticated();
		self.canReadCohorts = self.isAuthenticated && authApi.isPermittedReadCohorts();
		self.canCreateCohort = self.isAuthenticated && authApi.isPermittedCreateCohort();
	}

	var component = {
		viewModel: cohortDefinitions,
		template: view
	};

	ko.components.register('cohort-definitions', component);
	return component;
});
