define([
	'knockout',
	'text!./import.html',
	'providers/Component',
	'providers/AutoBind',
	'providers/Vocabulary',
	'utils/CommonUtils',
	'less!./import.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	vocabularyProvider,
	commonUtils
) {
	class Import extends AutoBind(Component) {
		constructor(params) {
			super(params);      
			this.model = params.model;
			this.loading = ko.observable(false);
			this.error = ko.observable('');
		}

		showConceptSet() {
			document.location = '#/conceptset/0/details';	
		}

		importConceptSetExpression() {
			this.loading(true);
			this.error('');
			const expressionJson = $('#textImportConceptSet').val();
			let items = [];
			try {
				items = JSON.parse(expressionJson).items;
			} catch (er) {
				this.loading(false);
				this.error('Unable to parse JSON');
				return false;
			}
			if (this.model.currentConceptSet() == undefined) {
				this.model.currentConceptSet({
					name: ko.observable('New Concept Set'),
					id: 0
				});
				this.model.currentConceptSetSource('repository');
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

			this.loading(false);
			this.showConceptSet();
		}
		
		importConceptIdentifiers() {
			this.loading(true);
			this.error('');
			const identifers = $('#textImportConceptIdentifiers').val().match(/[0-9]+/g); // all numeric sequences
			vocabularyProvider.getConceptsById(identifers)
				.then(items => this.initConceptSet(items))
				.then(() => this.showConceptSet())
				.catch((er) => {
					this.error(er);
				})
				.finally(() => {					
					this.loading(false);
				});
		}

		importSourcecodes() {
			this.loading(true);
			this.error('');
			const sourcecodes = $('#textImportSourcecodes').val().match(/[0-9a-zA-Z\.-]+/g);
			vocabularyProvider.getConceptsByCode(sourcecodes)
				.then(items => this.initConceptSet(items))
				.then(() => this.showConceptSet())
				.catch((er) => {
					this.error(er);
				})
				.finally(() => {					
					this.loading(false);
				});
		}

		initConceptSet(conceptSetItems) {
			const promise = new Promise((resolve, reject) => {
				try {
					if (this.model.currentConceptSet() == undefined) {
						this.model.currentConceptSet({
							name: ko.observable("New Concept Set"),
							id: 0
						});
						this.model.currentConceptSetSource('repository');
					}

					for (var i = 0; i < conceptSetItems.length; i++) {
						if (sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] != 1) {
							sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] = 1;
							var conceptSetItem = this.model.createConceptSetItem(conceptSetItems[i]);
							sharedState.selectedConcepts.push(conceptSetItem);
						}
					}
					resolve();
				} catch(er) {
					reject(er);
				}						
			});

			return promise;
		}

		clearImportedConceptSet(textArea) {
			$(textArea).val('');
			this.model.importedConcepts([]);
		}
	}

	return commonUtils.build('vocabulary-import', Import, view);
});
