define(['knockout', 'text!./cohort-definitions.html', 'knockout.dataTables.binding'], function (ko, view) {
	function cohortDefinitions(params) {
		var self = this;
		self.model = params.model;
		self.cohortDefinitionId = ko.observable();
		
		self.cohortDefinitionId.subscribe(function(d) {
			document.location = "#/cohortdefinition/" + d;
		});	
	}

	var component = {
		viewModel: cohortDefinitions,
		template: view
	};

	ko.components.register('cohort-definitions', component);
	return component;
});
