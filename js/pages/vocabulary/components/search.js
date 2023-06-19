define([
	'knockout',
	'atlas-state',
	'appConfig',
	'text!./search.html',
	'services/AuthAPI',
	'services/MomentAPI',
	'components/conceptset/utils',
	'../PermissionService',
	'components/Component',
	'utils/AutoBind',
	'services/http',
	'pages/vocabulary/const',
	'utils/CommonUtils',
	'services/Vocabulary',
	'components/conceptset/ConceptSetStore',
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
	config,
	view,
	authApi,
	MomentApi,
	conceptSetUtils,
	PermissionService,
	Component,
	AutoBind,
	httpService,
	constants,
	commonUtils,
	vocabularyProvider,
	ConceptSetStore,
) {
	class Search extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.currentSearch = ko.observable('');
			this.commonUtils = commonUtils;
			this.loading = ko.observable(false);
			this.recommending = ko.observable(false);
			this.searching = ko.pureComputed(() => this.loading() || this.recommending())
			this.isRecommendDisabled = ko.pureComputed(() => sharedState.RepositoryConceptSet.current() || this.searching());
			this.recommendButtonTooltip = ko.pureComputed(() => {
				if (sharedState.RepositoryConceptSet.current()) {
					return ko.i18n('search.recommend.conceptsetopen', 'A Concept Set is already open')()
				}
				else return null;
			});
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
				if (this.recommending()) {
					entities.push(ko.i18n('search.loadingMessage.recommending', 'recommended concept into new concept set')());
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
			this.columnHeadersWithIcons = [
				{
					id: 'rc',
					elementId: 'columnRC',
					title: ko.i18n('columns.rc', 'RC'),
					tooltip: ko.i18n('columns.rcTooltip', 'Record Count'),
					icon: 'fa-database'
				},
				{
					id: 'drc',
					elementId: 'columnDRC',
					title: ko.i18n('columns.drc', 'DRC'),
					tooltip: ko.i18n('columns.drcTooltip', 'Descendant Record Count'),
					icon: 'fa-database'
				},
				{
					id: 'pc',
					elementId: 'columnPC',
					title: ko.i18n('columns.pc', 'PC'),
					tooltip: ko.i18n('columns.pcTooltip', 'Person Count'),
					icon: 'fa-user'
				},
				{
					id: 'dpc',
					elementId: 'columnDPC',
					title: ko.i18n('columns.dpc', 'DPC'),
					tooltip: ko.i18n('columns.dpcTooltip', 'Descendant Person Count'),
					icon: 'fa-user'
				}
			];
			this.tableOptions = commonUtils.getTableOptions('L');
			this.renderColumnTitle = (id) => {
				const c = this.columnHeadersWithIcons.find((c) => c.id === id);
				return `<div style="white-space: nowrap" title="${c.tooltip()}"><i id="${c.elementId}" class="fa ${c.icon}"></i> ${c.title()}</div>`
			};
			this.searchColumns = [{
				title: '',
				render: (s, p, d) => this.renderCheckbox('isSelected'),
				orderable: false,
				searchable: false,
				renderSelectAll: true,
				selectAll: (data, selected) => {
					const conceptIds = data.map(c => c.CONCEPT_ID);
					ko.utils.arrayForEach(this.data(), c => conceptIds.indexOf(c.CONCEPT_ID) > -1 && c.isSelected(selected));
				}
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
				title: this.renderColumnTitle('rc'),
				data: 'RECORD_COUNT',
				className: 'numeric'
			}, {
				title: this.renderColumnTitle('drc'),
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			}, {
				title: this.renderColumnTitle('pc'),
				data: 'PERSON_COUNT',
				className: 'numeric',
				visible: config.enablePersonCount
			}, {
				title: this.renderColumnTitle('dpc'),
				data: 'DESCENDANT_PERSON_COUNT',
				className: 'numeric',
				visible: config.enablePersonCount
			}, {
				title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_START_DATE'] :
						MomentApi.formatDateTimeWithFormat(d['VALID_START_DATE'], MomentApi.DATE_FORMAT),
				visible: false
			}, {
				title: ko.i18n('columns.validEndDate', 'Valid End Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_END_DATE'] :
						MomentApi.formatDateTimeWithFormat(d['VALID_END_DATE'], MomentApi.DATE_FORMAT),
				visible: false
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

			if (config.enablePersonCount) {
					this.searchOptions.Facets.push({
							'caption': ko.i18n('facets.caption.hasPersonCount', 'Has Person Count'),
							'binding': function (o) {
									return parseInt(o.PERSON_COUNT) > 0;
							}
					}, {
							'caption': ko.i18n('facets.caption.hasDescendantPersonCount', 'Has Descendant Person Count'),
							'binding': function (o) {
									return parseInt(o.DESCENDANT_PERSON_COUNT) > 0;
							}
					});
			}

			this.currentResultSourceKey = ko.observable();
			this.resultSources = ko.computed(() => {
					const resultSources = [];
					sharedState.sources().forEach((source) => {
							if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
									resultSources.push(source);
									if (source.resultsUrl === sharedState.resultsUrl()) {
											this.currentResultSourceKey(source.sourceKey);
									}
							}
					})

					return resultSources;
			});
			this.recordCountsRefreshing = ko.observable(false);
			this.recordCountClass = ko.pureComputed(() => {
					return this.recordCountsRefreshing() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-database fa-lg";
			});

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

		recommendClick() {
			if (this.currentSearch().trim().length > 3 || this.currentSearch().split(" ") > 1) 
			{
				this.executeRecommend();
			} else {
				alert('Recommend search must have at least 4 letters or 2 separate terms');
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

		async executeSearch() {
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

			let query = this.currentSearch();
			this.loading(true);
			this.data([]);

			let searchParams = {
				"QUERY": query,
			}
			let promise = null;

			if (vocabElements.size > 0 || domainElements.size > 0) {
				// advanced search
				if (vocabElements.size > 0) {
					searchParams["VOCABULARY_ID"] = Array.from(vocabElements);
				}
				if (domainElements.size > 0) {
					searchParams["DOMAIN_ID"] = Array.from(domainElements);
				}
			}
			promise = vocabularyProvider.search(searchParams);
			promise.then((data) => this.handleSearchResults(data))
				.catch(er => {
					console.error('error while searching', er);
				})
				.finally(() => {
					this.loading(false);
					this.searchExecuted(true);
				});
		}

		async executeRecommend() {
			let searchParams = { 
				"QUERY": this.currentSearch(),
				"DOMAIN_ID": ["Condition", "Procedure", "Drug", "Measurement"],
				"IS_LEXICAL":true
			};

			try {
				this.recommending(true);
				this.searchExecuted(false);
				const recommendedConcepts = await vocabularyProvider.search(searchParams);
				if (recommendedConcepts.length == 0) {
					this.data([]); // indicate no results
					this.searchExecuted(true); // signals 'no results found' message
					return;
				}
				await vocabularyProvider.loadDensity(recommendedConcepts, this.currentResultSourceKey(),(v)=>parseInt(v,10)); // formatting values as ints
				recommendedConcepts.sort((a,b) => b.DESCENDANT_RECORD_COUNT - a.DESCENDANT_RECORD_COUNT); // sort descending order by DRC
				const conceptSetStore = ConceptSetStore.repository();
				const items = commonUtils.buildConceptSetItems([recommendedConcepts[0]], {includeDescendants: true});
				conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
				document.location = '#/conceptset/0/recommend';
			} finally {
				this.recommending(false);
			}
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

			const promise = vocabularyProvider.loadDensity(results, this.currentResultSourceKey());
			promise.then(() => {
				this.data(this.normalizeSearchResults(results));
			});

			return promise;
		}

		getSelectedConcepts() {
			return commonUtils.getSelectedConcepts(this.data)
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

		async refreshRecordCounts(obj, event) {
			if (!event.originalEvent) {
				return;
			}

			this.currentResultSourceKey(event.target.value);

			this.recordCountsRefreshing(true);
			this.columnHeadersWithIcons.forEach(c => this.toggleCountColumnHeaderSpin(c, true));
			const results = this.data();
			await vocabularyProvider.loadDensity(results, this.currentResultSourceKey());
			this.data(results);
			this.columnHeadersWithIcons.forEach(c => this.toggleCountColumnHeaderSpin(c, false));
			this.recordCountsRefreshing(false);
		}

		toggleCountColumnHeaderSpin(column, enable) {
			if (enable) {
				$('#' + column.elementId)
					.removeClass(column.icon)
					.addClass("fa-circle-notch")
					.addClass("fa-spin");
			} else {
				$('#' + column.elementId)
					.addClass(column.icon)
					.removeClass("fa-circle-notch")
					.removeClass("fa-spin");
			}
		}
	}

	return commonUtils.build('vocabulary-search', Search, view);
});
