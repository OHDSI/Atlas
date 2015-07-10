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

		self.contextSensitiveLinkColor = function (row, data) {
			var switchContext;

			if (data.STANDARD_CONCEPT == undefined) {
				switchContext = data.concept.STANDARD_CONCEPT;
			} else {
				switchContext = data.STANDARD_CONCEPT;
			}

			switch (switchContext) {
			case 'N':
				$('a', row).css('color', '#800');
				break;
			case 'C':
				$('a', row).css('color', '#080');
				break;
			}
		}

		self.renderConceptSelector = function (s,p,d) {
			var css = '';
			var icon = 'fa-shopping-cart';

			if (self.model.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}

		self.renderLink = function (s, p, d) {
			var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
			return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
		}
	}

	var component = {
		viewModel: atlasSearch,
		template: view
	};

	ko.components.register('atlas-search', component);
	return component;
});
