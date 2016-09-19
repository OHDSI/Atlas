define(['knockout', 'text!./home.html', 'webapi/AuthAPI'], function (ko, view, authApi) {
	function home(params) {
		var self = this;
		self.github_status = ko.observableArray();

		$.ajax({
			url: "https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=6",
			method: 'GET',
			contentType: 'application/json',
			success: function (data) {
				self.github_status(data);
			}
		});
		
		self.newCohortDefinition = function() {
			document.location = "#/cohortdefinition/0";
		}
		
		self.browseVocabulary = function() {
			document.location = "#/search";
		}

		self.canCreateCohort = authApi.isAuthenticated() && authApi.isPermittedCreateCohort();
	}

	var component = {
		viewModel: home,
		template: view
	};

	ko.components.register('home', component);
	return component;
});