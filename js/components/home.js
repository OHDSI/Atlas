define(['knockout', 'text!./home.html'], function (ko, view) {
	function home(params) {
		var self = this;
		self.github_status = ko.observableArray();

		$.ajax({
			url: "https://api.github.com/repos/OHDSI/Atlas/issues?state=closed&milestone=4",
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
	}

	var component = {
		viewModel: home,
		template: view
	};

	ko.components.register('home', component);
	return component;
});