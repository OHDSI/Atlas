define(['knockout', 'text!./home.html', 'appConfig'], function (ko, view, config) {
	function home(params) {
		var self = this;
		var authApi = params.model.authApi;
		self.github_status = ko.observableArray();

		$.ajax({
			url: "https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=12",
			method: 'GET',
			contentType: 'application/json',
			success: function (data) {
				self.github_status(data);
			}
		});

		self.newCohortDefinition = function () {
			document.location = "#/cohortdefinition/0";
		}

		self.browseVocabulary = function () {
			document.location = "#/search";
		}

		self.canCreateCohort = ko.pureComputed(function () {
			return (authApi.isAuthenticated() && authApi.isPermittedCreateCohort()) || !config.userAuthenticationEnabled;
		});
	}

	var component = {
		viewModel: home,
		template: view
	};

	ko.components.register('home', component);
	return component;
});
