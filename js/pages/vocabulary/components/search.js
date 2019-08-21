define([
	'knockout',
	'atlas-state',
	'text!./search.html',
	'appConfig',
	'services/AuthAPI',
	'../PermissionService',
	'components/Component',
	'utils/AutoBind',
	'services/http',
	'pages/vocabulary/const',
	'utils/CommonUtils',
	'services/Vocabulary',
	'components/tabs',
	'components/panel',
	'faceted-datatable',
	'components/empty-state',
	'less!./search.less'
], function (
	ko,
	sharedState,
	view,
	config,
	authApi,
	PermissionService,
	Component,
	AutoBind,
	httpService,
	constants,
	commonUtils,
	vocabularyProvider
) {
	class Search extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.currentSearch = ko.observable('');
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
					entities.push('domains');
				}
				if (this.vocabulariesLoading()) {
					entities.push('vocabularies');
				}
				if (this.loading()) {
					entities.push('search results');
				}
				return `Loading ${entities.join(', ')}`;
			});
			// 'colvis',
			this.buttons = [
				{
					extend: 'colvis',
					columnText: (dt, idx, title) => {
						if (idx === 0) {
							return '<i class="fa fa-shopping-cart"></i>';
						}
						return title;
					}
				},
				'copyHtml5',
				'excelHtml5',
				'csvHtml5',
				'pdfHtml5'
			];

			this.searchColumns = [{
				title: '<i class="fa fa-shopping-cart"></i>',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';
					if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
			}, {
				title: 'Id',
				data: 'CONCEPT_ID'
			}, {
				title: 'Code',
				data: 'CONCEPT_CODE'
			}, {
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			}, {
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			}, {
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			}, {
				title: 'RC',
				data: 'RECORD_COUNT',
				className: 'numeric'
			}, {
				title: 'DRC',
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			}, {
				title: 'Domain',
				data: 'DOMAIN_ID'
			}, {
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			}];

			this.searchOptions = {
				Facets: [{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				}, {
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				}, {
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				}, {
					'caption': 'Has Records',
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				}, {
					'caption': 'Has Descendant Records',
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

		replaceSpecialCharacters(str) {
			return str.replace("/", " ");
		}
		
		encodeSearchString(searchTerm) {
			return encodeURIComponent(this.replaceSpecialCharacters(searchTerm));
		}

		searchClick() {
			const redirectUrl = '#/search/' + this.encodeSearchString(this.currentSearch());
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
				this.currentSearch(this.replaceSpecialCharacters(this.currentSearch()));
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
				searchUrl += `/${query}`;
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

		handleSearchResults(results) {
			if (results.length === 0) {
				throw { message: 'No results found', results };
			}

			const promise = vocabularyProvider.loadDensity(results);
			promise.then(() => {
				this.data(results);
			});

			return promise;
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
			return 'No results found for \"' + this.currentSearch() + '\"';
		}
	}

	return commonUtils.build('vocabulary-search', Search, view);
});
