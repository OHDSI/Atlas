define(['knockout', 'text!./cohort-conceptset-manager.html', 'bootstrap'], function (ko, view) {
	function cohortConceptSetManager(params) {
		var self = this;
		self.model = params.model;

        self.routeTo = function(mode) {
            document.location = '#/cohortdefinition/' + self.model.currentCohortDefinition().id() + '/conceptset/' + self.model.currentConceptSet().id + '/' + mode;
		}
    }

	var component = {
		viewModel: cohortConceptSetManager,
		template: view
	};

	ko.components.register('cohort-conceptset-manager', component);
	return component;
});
