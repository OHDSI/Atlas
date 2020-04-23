define([
	'knockout',
	'text!./import.html',
	'components/Component',
	'utils/AutoBind',
	'appConfig',
	'services/Vocabulary',
	'utils/CommonUtils',
	'atlas-state',
	'services/AuthAPI',
	'../PermissionService',
	'../const',
	'less!./import.less',
], function (
	ko,
	view,
	Component,
	AutoBind,
	config,
	vocabularyProvider,
	commonUtils,
	sharedState,
	AuthAPI,
	PermissionService,
	constants,
) {
	class Import extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = ko.observable(false);
			this.error = ko.observable('');
			this.commonUtils = commonUtils;
			this.importModes = constants.importModes;
			this.currentConceptSet = sharedState.ConceptSet.current;
			this.currentConceptSetSource = sharedState.ConceptSet.source;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.canEditCurrentConceptSet = ko.pureComputed(() => {
				if (!AuthAPI.isAuthenticated()) {
					return false;
				}

				if (this.currentConceptSet() && (this.currentConceptSet()
						.id != 0)) {
					return AuthAPI.isPermittedUpdateConceptset(this.currentConceptSet()
						.id) || !config.userAuthenticationEnabled;
				} else {
					return AuthAPI.isPermittedCreateConceptset() || !config.userAuthenticationEnabled;
				}
			});
			this.renderConceptSetItemSelector = commonUtils.renderConceptSetItemSelector.bind(this);
			this.currentImportMode = ko.observable(this.importModes.IDENTIFIERS);
			this.isAuthenticated = AuthAPI.isAuthenticated;
			this.isPermittedLookupIds = ko.computed(() => PermissionService.isPermittedLookupIds());
			this.isPermittedLookupCodes = ko.computed(() => PermissionService.isPermittedLookupCodes());
		}

		showConceptSet() {
			const conceptSetId = this.currentConceptSet() ? this.currentConceptSet().id : 0;
			document.location = `#/conceptset/${conceptSetId}/details`;
		}

		renderCheckbox(field) {
			if (this.canEditCurrentConceptSet()) {
				return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()) } ,css: { selected: ' + field + '} " class="fa fa-check"></span>';
			} else {
				return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check readonly"></span>';
			}
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
			if (this.currentConceptSet() == undefined) {
				this.currentConceptSet({
					name: ko.observable('New Concept Set'),
					id: 0
				});
				this.currentConceptSetSource('repository');
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
                this.error(ko.i18n('search.import.unableToParseConceptIdentifiers', 'Unable to parse Concept Identifiers')());
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
					if (this.currentConceptSet() == undefined) {
						this.currentConceptSet({
							name: ko.observable("New Concept Set"),
							id: 0
						});
						this.currentConceptSetSource('repository');
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
		}
	}

	return commonUtils.build('vocabulary-import', Import, view);
});
