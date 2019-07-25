define([
	'knockout',
	'text!./import.html',
	'components/Component',
	'utils/AutoBind',
	'services/Vocabulary',
	'utils/CommonUtils',
	'atlas-state',
	'services/AuthAPI',
	'../PermissionService',
	'less!./import.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	vocabularyProvider,
	commonUtils,
	sharedState,
	AuthAPI,
	PermissionService,
) {
	class Import extends AutoBind(Component) {
		constructor(params) {
			super(params);      
			this.model = params.model;
			this.loading = ko.observable(false);
			this.error = ko.observable('');

			this.isAuthenticated = AuthAPI.isAuthenticated;
			this.isPermittedLookupIds = ko.computed(() => PermissionService.isPermittedLookupIds());
			this.isPermittedLookupCodes = ko.computed(() => PermissionService.isPermittedLookupCodes());
		}

		showConceptSet() {
			const conceptSetId = this.model.currentConceptSet() ? this.model.currentConceptSet().id : 0;
			document.location = `#/conceptset/${conceptSetId}/details`;	
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
            if (identifers === null) {
                this.error('Unable to parse Concept Identifiers');
                this.loading(false);
            } else {
                vocabularyProvider.getConceptsById(identifers)
                    .then(({data: items}) => {
                        this.initConceptSet(items)
                    })
                    .then(() => this.showConceptSet())
                    .catch((er) => {
                        this.error(er);
                    })
                    .finally(() => {
                        this.loading(false);
                    });
            }
        }

		importSourcecodes() {
			this.loading(true);
			this.error('');
			const sourcecodes = $('#textImportSourcecodes').val().match(/[0-9a-zA-Z\.-]+/g);
			vocabularyProvider.getConceptsByCode(sourcecodes)
				.then(({ data: items }) => { this.initConceptSet(items) })
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

					var conceptSetItemsToAdd = sharedState.selectedConcepts();
					for (var i = 0; i < conceptSetItems.length; i++) {
						if (sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] != 1) {
							sharedState.selectedConceptsIndex[conceptSetItems[i].CONCEPT_ID] = 1;
							conceptSetItemsToAdd.push(commonUtils.createConceptSetItem(conceptSetItems[i]));
						}
					}
					sharedState.selectedConcepts(conceptSetItemsToAdd);
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
