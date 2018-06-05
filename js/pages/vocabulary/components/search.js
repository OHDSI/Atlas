define([
	'knockout',
	'atlas-state',
	'text!./search.html',
	'appConfig',
	'webapi/AuthAPI',
  'providers/Component',
  'services/http',
  'pages/vocabulary/const',
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
  Component,
  httpService,
  helpers
) {
	class Search extends Component {
		static get name() {
			return 'vocabulary-search';
		}

		static get view() {
			return view;
		}

		constructor(params) {
			super(params);
      this.currentSearch = ko.observable('');
      this.loading = ko.observable(true);
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
      this.concepts = ko.observableArray([]);
      this.searchExecuted = ko.observable(false);
      this.searchConceptsColumns = ko.observableArray([]);
      this.searchConceptsOptions = ko.observable();
      this.contextSensitiveLinkColor = ko.observable();

      this.isInProgress = ko.computed(() => {
        return this.domainsLoading() === true && this.vocabulariesLoading() === true;
      });
      this.isInProgress.subscribe((isInProgress) => {
        if (!isInProgress) {
          if (params.query) {
            this.currentSearch(params.query);
            this.executeSearch();
          }
        }
      });
      this.currentSearch.subscribe(() => this.searchExecuted(false));

      this.searchConceptsColumns = [{
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
        render: function (s, p, d) {
          var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
          return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
        }
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
  
      this.searchConceptsOptions = {
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
            return parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0;
          }
        }, {
          'caption': 'Has Descendant Records',
          'binding': function (o) {
            return parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0;
          }
        }]
      };

      this.searchClick = this.searchClick.bind(this);
      this.clearAllAdvanced = this.clearAllAdvanced.bind(this); 
      this.toggleAdvanced = this.toggleAdvanced.bind(this);
      this.toggleVocabulary = this.toggleVocabulary.bind(this);
      this.toggleDomain = this.toggleDomain.bind(this);
      this.updateSearchFilters = this.updateSearchFilters.bind(this);

      this.getDomains();
      this.getVocabularies();
    }
    
    searchClick() {
      if (this.selected.vocabularies.size > 0 || this.selected.domains.size > 0) {
				this.executeSearch();
			} else if (this.currentSearch().length > 2) {
				document.location = '#/search/' + escape(this.currentSearch());
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
			this.concepts(this.feSearch().GetCurrentObjects());
    }
    
    executeSearch() {
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

			const query = this.currentSearch() === undefined ? '' : this.currentSearch();
      this.loading(true);
      
      let searchUrl = `${sharedState.vocabularyUrl()}search`;
      let searchParams = null;
      
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
			} else {
        // simple search
        searchUrl += `/${query}`;				
			}
      httpService.doPost(searchUrl, searchParams)
      .then(({ data }) => this.handleSearchResults(data))
      .catch(er => {
        this.loading(false);
        console.error('error while searching', er);
      })
      .finally(() => {
        this.searchExecuted(true);
      });      
    }

    getVocabularies() {
      httpService.doGet(helpers.apiPaths.vocabularies())
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
      httpService.doGet(helpers.apiPaths.domains())
        .then(({ data }) => {
          const domains = data.sort(function (a, b) {
            return (a.VOCABULARY_ID.toUpperCase() < b.VOCABULARY_ID.toUpperCase()) ? -1 : (a.VOCABULARY_ID.toUpperCase() > b.VOCABULARY_ID.toUpperCase()) ? 1 : 0;
          });
          this.domains(domains);
        })
        .catch(er => console.error('Error occured when loading domains', er))
        .finally(() => {
          this.domainsLoading(false);
        });
    }
	}

	return Component.build(Search);
});
