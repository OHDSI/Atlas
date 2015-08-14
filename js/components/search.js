define(['knockout', 'text!./search.html', 'knockout.dataTables.binding'], function (ko, view) {
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

		self.renderConceptSelector = function (s,p,d) {
			var css = '';
			var icon = 'fa-shopping-cart';

			if (self.model.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}
	}

	var component = {
		viewModel: atlasSearch,
		template: view
	};

	ko.components.register('atlas-search', component);
	return component;
});
