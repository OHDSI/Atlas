define([
	'knockout',
	'text!./import.html',
	'providers/Component',
	'providers/Vocabulary',
	'utils/CommonUtils',
	'less!./import.less',
], function (
	ko,
	view,
	Component,
	vocabularyProvider,
	commonUtils
) {
	class Import extends Component {
		constructor(params) {
			super(params);      
			this.model = params.model;
		}

		importConceptSetExpression() {
			const expressionJson = $('#textImportConceptSet').val();
			const items = JSON.parse(expressionJson).items;
			if (pageModel.currentConceptSet() == undefined) {
				pageModel.currentConceptSet({
					name: ko.observable('New Concept Set'),
					id: 0
				});
				pageModel.currentConceptSetSource('repository');
			}

			for (let i = 0; i < items.length; i++) {
				const conceptSetItem = {}

				conceptSetItem.concept = items[i].concept;
				conceptSetItem.isExcluded = ko.observable(items[i].isExcluded);
				conceptSetItem.includeDescendants = ko.observable(items[i].includeDescendants);
				conceptSetItem.includeMapped = ko.observable(items[i].includeMapped);

				sharedState.selectedConceptsIndex[items[i].concept.CONCEPT_ID] = 1;
				sharedState.selectedConcepts.push(conceptSetItem);
			}

			document.location = '#/conceptset/0/details';
		}
		
		importConceptIdentifiers() {
			const identifers = $('#textImportConceptIdentifiers').val().match(/[0-9]+/g); // all numeric sequences
			vocabularyProvider.getConceptsById(identifers).then(this.initConceptSet);
		}

		importSourcecodes() {
			const sourcecodes = $('#textImportSourcecodes').val().match(/[0-9a-zA-Z\.-]+/g);
			vocabularyProvider.getConceptsByCode(sourcecodes).then(this.initConceptSet);
		}

		initConceptSet(conceptSetItems) {
			if (self.model.currentConceptSet() == undefined) {
				self.model.currentConceptSet({
					name: ko.observable("New Concept Set"),
					id: 0
				});
				self.model.currentConceptSetSource('repository');
			}

			for (var i = 0; i < conceptSetItems.length; i++) {
				if (sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] != 1) {
					sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] = 1;
					var conceptSetItem = self.model.createConceptSetItem(conceptSetItems[i]);
					sharedState.selectedConcepts.push(conceptSetItem);
				}
			}
			document.location = '#/conceptset/0/details';
		}

		clearImportedConceptSet(textArea) {
			$(textArea).val('');
			this.model.importedConcepts([]);
		}
	}

	return commonUtils.build('vocabulary-import', Import, view);
});
