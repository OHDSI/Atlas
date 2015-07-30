define(['knockout', 'text!./cohort-definitions.html', 'knockout.dataTables.binding'], function (ko, view) {
	function cohortDefinitions(params) {
		var self = this;
		self.model = params.model;
		self.renderCohortDefinitionLink = function (s, p, d) {
			return '<a href=\"#/cohortdefinition/' + d.id + '\">' + d.name + '</a>';
		}
	}

	var component = {
		viewModel: cohortDefinitions,
		template: view
	};

	ko.components.register('cohort-definitions', component);
	return component;
});
