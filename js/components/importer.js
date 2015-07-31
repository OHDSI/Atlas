define(['knockout', 'text!./importer.html', 'knockout.dataTables.binding'], function (ko, view) {
	function importer(params) {
		var self = this;
		self.model = params.model;

		self.importConceptSetExpression = function () {
			var expressionJson = $('#textImportConceptSet').val();
			var items = JSON.parse(expressionJson).items;
			for (var i = 0; i < items.length; i++) {
				var conceptSetItem = {}

				conceptSetItem.concept = items[i].concept;
				conceptSetItem.isExcluded = ko.observable(items[i].isExcluded);
				conceptSetItem.includeDescendants = ko.observable(items[i].includeDescendants);
				conceptSetItem.includeMapped = ko.observable(items[i].includeMapped);

				self.model.selectedConceptsIndex[items[i].concept.CONCEPT_ID] = 1;
				self.model.selectedConcepts.push(conceptSetItem);
			}
		}

		self.importConceptIdentifiers = function () {
			var identifers = $('#textImportConceptIdentifiers').val().match(/[0-9]+/g); // all numeric sequences
			$.ajax({
				url: self.model.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(identifers),
				success: function (data) {
					self.model.importedConcepts(data);
				}
			});
		}

		self.importSourcecodes = function () {
			var sourcecodes = $('#textImportSourcecodes').val().match(/[0-9a-zA-Z\.-]+/g); 
			console.log(sourcecodes);
			$.ajax({
				url: self.model.vocabularyUrl() + 'lookup/sourcecodes',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(sourcecodes),
				success: function (data) {
					self.model.importedConcepts(data);
				}
			});
		}

	}

	var component = {
		viewModel: importer,
		template: view
	};

	ko.components.register('importer', component);
	return component;
});