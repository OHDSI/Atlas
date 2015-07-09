define(['knockout', 'text!./search.html'], function (ko, view) {
	function atlasSearch(params) {
		var self = this;
		self.model = params.model;

		self.checkExecuteSearch = function (data, e) {
			if (e.keyCode == 13) { // enter
				var query = $('#querytext').val();
				if (query.length > 2) {
					document.location = "#/search/" + encodeURI(query);
				} else {
					$('#helpMinimumQueryLength').modal('show');
				}
			}
		};
	}

	var component = {
		viewModel: atlasSearch,
		template: view
	};

	ko.components.register('atlas-search', component);
	return component;
});
