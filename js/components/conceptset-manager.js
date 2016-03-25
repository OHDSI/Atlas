define(['knockout', 'text!./conceptset-manager.html', 'knockout.dataTables.binding', 'bootstrap','faceted-datatable', 'databindings'], function (ko, view) {
	function conceptsetManager(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = ko.observableArray();

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.saveClick = function () {
			self.saveConceptSet();
		}

		self.routeTo = function(mode) {
			if (self.model.currentConceptSet() == undefined) {
				document.location = '#/conceptset/0/' + mode;
			} else {
				document.location = '#/conceptset/' + self.model.currentConceptSet().id + '/' + mode;
			}
		}

		self.closeConceptSet = function() {
            if (self.model.currentConceptSetDirtyFlag.isDirty() && !confirm("Your concept set changes are not saved. Would you like to continue?")) {
                return;
            } else {                
                pageModel.clearConceptSet();
                document.location = "#/conceptsets";
            }
		};
		
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

			var json = ko.toJSON(conceptSet);

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
							document.location = '#/conceptset/' + data.id + '/details';
							self.model.currentConceptSetDirtyFlag.reset();
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
