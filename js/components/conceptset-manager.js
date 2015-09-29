define(['knockout', 'text!./conceptset-manager.html', 'knockout.dataTables.binding', 'bootstrap'], function (ko, view) {
	function conceptsetManager(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = ko.observableArray();

		self.loadConceptSets = function () {
			$.ajax({
				method: 'GET',
				url: self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
					self.conceptSets(data);
					$('#conceptSetLoadDialog').modal('show');
				}
			});
		}

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.saveClick = function () {
			if (self.model.currentConceptSet() == undefined) {
				$('#conceptSetSaveDialog').modal('show');
			} else {
				self.saveConceptSet();
			}
		}

		self.routeTo = function(mode) {
			if (self.model.currentConceptSet() == undefined) {
				document.location = '#/conceptset/0/' + mode;
			} else {
				document.location = '#/conceptset/' + self.model.currentConceptSet().id + '/' + mode;
			}
		}
		
		self.saveConceptSet = function () {
			var conceptSet = {};

			if (self.model.currentConceptSet() == undefined) {
				conceptSet.name = self.conceptSetName();

			} else {
				conceptSet = self.model.currentConceptSet();
			}

			var conceptSetItems = [];

			for (var i = 0; i < self.model.selectedConcepts().length; i++) {
				var item = self.model.selectedConcepts()[i];
				conceptSetItems.push({
					conceptId: item.concept.CONCEPT_ID,
					isExcluded: +item.isExcluded(),
					includeDescendants: +item.includeDescendants(),
					includeMapped: +item.includeMapped()
				});
			}

			var json = JSON.stringify(conceptSet);

			$.ajax({
				method: 'POST',
				url: self.model.services()[0].url + 'conceptset/',
				contentType: 'application/json',
				data: json,
				dataType: 'json',
				success: function (data) {

					$.ajax({
						method: 'POST',
						url: self.model.services()[0].url + 'conceptset/' + data.id + '/items',
						data: JSON.stringify(conceptSetItems),
						dataType: 'json',
						contentType: 'application/json',
						success: function (itemSave) {
							$('#conceptSetSaveDialog').modal('hide');
							document.location = '#/conceptset/' + data.id;
						}
					});
				}
			});
			
		}
	}

	var component = {
		viewModel: conceptsetManager,
		template: view
	};

	ko.components.register('conceptset-manager', component);
	return component;
});