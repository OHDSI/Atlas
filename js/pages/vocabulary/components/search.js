define([
	'knockout',
	'atlas-state',
	'text!./search.html',
	'services/AuthAPI',
	'components/conceptset/utils',
	'../PermissionService',
	'components/Component',
	'utils/AutoBind',
	'services/http',
	'pages/vocabulary/const',
	'utils/CommonUtils',
	'services/Vocabulary',
	'components/conceptset/ConceptSetStore',
	'const',
	'components/tabs',
	'components/panel',
	'faceted-datatable',
	'components/empty-state',
	'components/conceptLegend/concept-legend',
	'components/conceptAddBox/concept-add-box',
	'less!./search.less'
], function (
	ko,
	sharedState,
	view,
	authApi,
	conceptSetUtils,
	PermissionService,
	Component,
	AutoBind,
	httpService,
	constants,
	commonUtils,
	vocabularyProvider,
	ConceptSetStore,
	globalConstants,
) {
	class Search extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.currentSearch = ko.observable('');
			this.commonUtils = commonUtils;
			this.loading = ko.observable(false);
			this.domainsLoading = ko.observable(true);
			this.vocabulariesLoading = ko.observable(true);
			this.canSearch = ko.observable(true);
			this.showAdvanced = ko.observable(false);
			this.domains = ko.observableArray();
			this.vocabularies = ko.observableArray();
			this.selected = {
				domains: new Set(),
				vocabularies: new Set(),
			};
			this.data = ko.observableArray([]);
			this.searchExecuted = ko.observable(false);
			this.searchColumns = ko.observableArray([]);
			this.searchOptions = ko.observable();
			this.params = params;
			this.canAddConcepts = ko.pureComputed(() => this.data().some(item => item.isSelected()) );

				this.isInProgress = ko.computed(() => {
					return this.domainsLoading() === true && this.vocabulariesLoading() === true;
				});
				this.isInProgress.subscribe((isInProgress) => {
					if (!isInProgress) {
						if (params.query()) {
							this.currentSearch(params.query());
							this.executeSearch();
						}
					}
				});
				params.query.subscribe(() => {
					if (!this.isInProgress()) {
						this.currentSearch(params.query());
						this.executeSearch();
					}
				});
				this.currentSearch.subscribe(() => this.searchExecuted(false));
				this.loadingMessage = ko.computed(() => {
					const entities = [];
					if (this.domainsLoading()) {
						entities.push(ko.i18n('search.loadingMessage.domains', 'domains')());
					}
					if (this.vocabulariesLoading()) {
						entities.push(ko.i18n('search.loadingMessage.vocabularies', 'vocabularies')());
					}
					if (this.loading()) {
						entities.push(ko.i18n('search.loadingMessage.searchResults', 'search results')());
					}
					return ko.i18n('search.loadingMessage.loading', 'Loading')() +
							` ${entities.join(', ')}`;
				});
				this.buttons = [
					'colvis',
					'copyHtml5',
					'excelHtml5',
					'csvHtml5',
					'pdfHtml5'
				];
				this.tableOptions = commonUtils.getTableOptions('L');
				this.searchColumns = [{
					title: '',
					render: (s, p, d) => this.renderCheckbox('isSelected'),
					orderable: false,
				},{
					title: ko.i18n('columns.id', 'Id'),
					data: 'CONCEPT_ID'
				}, {
					title: ko.i18n('columns.code', 'Code'),
					data: 'CONCEPT_CODE'
				}, {
					title: ko.i18n('columns.name', 'Name'),
					data: 'CONCEPT_NAME',
					render: commonUtils.renderLink,
				}, {
					title: ko.i18n('columns.class', 'Class'),
					data: 'CONCEPT_CLASS_ID'
				}, {
					title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
					data: 'STANDARD_CONCEPT_CAPTION',
					visible: false
				}, {
					title: ko.i18n('columns.rc', 'RC'),
					data: 'RECORD_COUNT',
					className: 'numeric'
				}, {
					title: ko.i18n('columns.drc', 'DRC'),
					data: 'DESCENDANT_RECORD_COUNT',
					className: 'numeric'
				}, {
					title: ko.i18n('columns.domain', 'Domain'),
					data: 'DOMAIN_ID'
				}, {
					title: ko.i18n('columns.vocabulary', 'Vocabulary'),
					data: 'VOCABULARY_ID'
				}];

				this.searchOptions = {
					Facets: [{
						'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
						'binding': function (o) {
							return o.VOCABULARY_ID;
						}
					}, {
						'caption': ko.i18n('facets.caption.class', 'Class'),
						'binding': function (o) {
							return o.CONCEPT_CLASS_ID;
						}
					}, {
						'caption': ko.i18n('facets.caption.domain', 'Domain'),
						'binding': function (o) {
							return o.DOMAIN_ID;
						}
					}, {
						'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
						'binding': function (o) {
							return o.STANDARD_CONCEPT_CAPTION;
						}
					}, {
						'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
						'binding': function (o) {
							return o.INVALID_REASON_CAPTION;
						}
					}, {
						'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
						'binding': function (o) {
							return parseInt(o.RECORD_COUNT) > 0;
						}
					}, {
						'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
						'binding': function (o) {
							return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
						}
					}]
				};

				this.isAuthenticated = authApi.isAuthenticated;
				this.hasAccess = ko.computed(() => PermissionService.isPermittedSearch());

				if (this.hasAccess()) {
					this.getDomains();
					this.getVocabularies();
				}
			}

			renderCheckbox(field) {
				return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()) } ,css: { selected: ' + field + '} " class="fa fa-check"></span>';
			}

			encodeSpecialCharacters(str) {
				str = encodeURIComponent(str);
				str = str.replace(/\*/g, '%2A'); // handle asterisk for wildcard search
				return str;
			}

			encodeSearchString(searchTerm) {
				return this.encodeSpecialCharacters(searchTerm);
			}

			searchClick() {
				const redirectUrl = '#/search?query=' + this.encodeSearchString(this.currentSearch());
				if (this.selected.vocabularies.size > 0 || this.selected.domains.size > 0 || document.location.hash === redirectUrl) {
					this.executeSearch();
				} else if (this.currentSearch().length > 2) {
					document.location = redirectUrl;
				} else {
					alert('invalid search');
				}
			}

			clearAllAdvanced() {
				$('.advanced-options input').attr('checked', false);
				this.selected.vocabularies.clear();
				this.selected.domains.clear();
			}

			toggleAdvanced() {
				this.showAdvanced(!this.showAdvanced());
			}

			toggleVocabulary(id) {
				this.selected.vocabularies.has(id)
					? this.selected.vocabularies.delete(id)
					: this.selected.vocabularies.add(id, true);
			}

			toggleDomain(id) {
				this.selected.domains.has(id)
					? this.selected.domains.delete(id)
					: this.selected.domains.add(id, true);
			}

			updateSearchFilters() {
				$(event.target).toggleClass('selected');
				const filters = [];
				$('#wrapperSearchResultsFilter .facetMemberName.selected').each(function (i, d) {
					filters.push(d.id);
				});
				this.feSearch().SetFilter(filters);
				// update filter data binding
				this.feSearch(this.feSearch());
				// update table data binding
				this.data(this.feSearch().GetCurrentObjects());
			}

			onKeyPress(event) {
				if (event.keyCode === 13) {
					this.searchClick();
				} else {
					return true;
				}
			}
			executeSearch() {
				if (!this.currentSearch() && !this.showAdvanced()) {
					this.data([]);
					return;
				}

				this.searchExecuted(false);
				const vocabElements = this.selected.vocabularies;
				const domainElements = this.selected.domains;

				// if we don't have a search and aren't looking up domain or vocabulary details, abort.
				if (
					this.currentSearch() === undefined
					&& vocabElements.size == 0
					&& domainElements.size == 0
				) {
					return;
				}

				let query = '';
				if (this.currentSearch() !== undefined) {
					query = this.encodeSearchString(this.currentSearch());
				}
				this.loading(true);
				this.data([]);

				let searchUrl = `${sharedState.vocabularyUrl()}search`;
				let searchParams = null;
				let promise = null;

				if (vocabElements.size > 0 || domainElements.size > 0) {
					// advanced search
					searchParams = {
						"QUERY": query,
					};
					if (vocabElements.size > 0) {
						searchParams["VOCABULARY_ID"] = Array.from(vocabElements);
					}
					if (domainElements.size > 0) {
						searchParams["DOMAIN_ID"] = Array.from(domainElements);
					}
					promise = httpService.doPost(searchUrl, searchParams);
				} else {
					// simple search
					searchUrl += `?query=${query}`;

					promise = httpService.doGet(searchUrl, searchParams);
				}

				promise.then(({ data }) => this.handleSearchResults(data))
					.catch(er => {
						console.error('error while searching', er);
					})
					.finally(() => {
						this.loading(false);
						this.searchExecuted(true);
					});
			}

			getCheckBoxState(conceptId, key) {
				const { selectedConceptsIndex, selectedConcepts } = sharedState;
				const isConceptSelected = selectedConceptsIndex[conceptId];
				if (isConceptSelected) {
					const selectedConcept = selectedConcepts().find(item => item.concept.CONCEPT_ID === conceptId);
					return selectedConcept[key];
				}
				return ko.observable(false);
			}

			normalizeSearchResults(searchResults) {
				return searchResults.map(item => ({
					...item,
					isSelected: ko.observable(false),
					includeDescendants: this.getCheckBoxState(item.CONCEPT_ID, 'includeDescendants'),
					includeMapped: this.getCheckBoxState(item.CONCEPT_ID, 'includeMapped'),
					isExcluded: this.getCheckBoxState(item.CONCEPT_ID, 'isExcluded'),
				}));
			}

			handleSearchResults(results) {
				if (results.length === 0) {
					throw { message: 'No results found', results };
				}

				const promise = vocabularyProvider.loadDensity(results);
				promise.then(() => {
					this.data(this.normalizeSearchResults(results));
				});

				return promise;
			}

			addConcepts(options, conceptSetStore = ConceptSetStore.repository()) {
				sharedState.activeConceptSet(conceptSetStore);
				const concepts = commonUtils.getSelectedConcepts(this.data);
				const items = commonUtils.buildConceptSetItems(concepts, options);
				conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
				commonUtils.clearConceptsSelectionState(this.data);
			}

			getVocabularies() {
				httpService.doGet(constants.apiPaths.vocabularies())
					.then(({ data }) => {
						const vocabularies = data.sort(function (a, b) {
							return (a.VOCABULARY_ID.toUpperCase() < b.VOCABULARY_ID.toUpperCase()) ? -1 : (a.VOCABULARY_ID.toUpperCase() > b.VOCABULARY_ID.toUpperCase()) ? 1 : 0;
						});
						this.vocabularies(vocabularies);
					})
					.catch(er => console.error('Error occured when loading vocabularies', er))
					.finally(() => {
						this.vocabulariesLoading(false);
					});
			}

			getDomains() {
				httpService.doGet(constants.apiPaths.domains())
					.then(({ data }) => {
						this.domains(data);
					})
					.catch(er => console.error('Error occured when loading domains', er))
					.finally(() => {
						this.domainsLoading(false);
					});
			}

			noResultsFoundMessage() {
				return ko.i18n('search.noResultsFoundFor', 'No results found for')() + ' \"' + this.currentSearch() + '\"';
			}
		}

		return commonUtils.build('vocabulary-search', Search, view);
	});
