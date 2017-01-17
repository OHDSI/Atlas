define(['knockout', 'text!./search.html', 'vocabularyprovider', 'atlas-state', 'knockout.dataTables.binding', 'faceted-datatable'], function (ko, view, vocabAPI, sharedState) {
	function search(params) {
		var self = this;
		self.model = params.model;
		self.loading = ko.observable(false);
		self.advancedQuery = ko.observable('');
		self.initialized = false;
		self.vocabularies = ko.observableArray();
		self.domains = ko.observableArray();
		self.tabMode = ko.observable('simple');
		self.currentSearch = ko.observable();
		if (params.query) {
			self.currentSearch(params.query);
		}
		self.concepts = ko.observableArray();		
		self.currentSearchValue = ko.observable();
		self.feSearch = ko.observable();
		
		self.searchConceptsColumns = [{
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

		self.searchConceptsOptions = {
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
		
		self.updateSearchFilters = function () {
			$(event.target).toggleClass('selected');
			var filters = [];
			$('#wrapperSearchResultsFilter .facetMemberName.selected').each(function (i, d) {
				filters.push(d.id);
			});
			self.feSearch().SetFilter(filters);
			// update filter data binding
			self.feSearch(self.feSearch());
			// update table data binding
			self.concepts(self.feSearch().GetCurrentObjects());
		};
		
		self.selectConcept = function (concept) {
			document.location = '#/concept/' + concept.CONCEPT_ID;
		};
		

		self.currentSearchValue = ko.computed(function () {
			return unescape(self.currentSearch());
		}, this);


		self.currentSearch.subscribe(function (query) {
			if (self.currentSearch().length > 2) {
				document.location = '#/search/' + escape(query);
			}
		});

		self.importConceptSetExpression = function () {
			var expressionJson = $('#textImportConceptSet').val();
			var items = JSON.parse(expressionJson).items;
			if (pageModel.currentConceptSet() == undefined) {
				pageModel.currentConceptSet({
					name: ko.observable('New Concept Set'),
					id: 0
				});
				pageModel.currentConceptSetSource('repository');
			}

			for (var i = 0; i < items.length; i++) {
				var conceptSetItem = {}

				conceptSetItem.concept = items[i].concept;
				conceptSetItem.isExcluded = ko.observable(items[i].isExcluded);
				conceptSetItem.includeDescendants = ko.observable(items[i].includeDescendants);
				conceptSetItem.includeMapped = ko.observable(items[i].includeMapped);

				sharedState.selectedConceptsIndex[items[i].concept.CONCEPT_ID] = 1;
				sharedState.selectedConcepts.push(conceptSetItem);
			}
		}

		self.importConceptIdentifiers = function () {
			var identifers = $('#textImportConceptIdentifiers').val().match(/[0-9]+/g); // all numeric sequences
			$.ajax({
				url: sharedState.vocabularyUrl() + 'lookup/identifiers',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(identifers),
				success: function (data) {
					// Automatically add these concepts to the active concept set
					self.initConceptSet(data);
					self.model.importedConcepts(data);
				}
			});
		}

		self.importSourcecodes = function () {
			var sourcecodes = $('#textImportSourcecodes').val().match(/[0-9a-zA-Z\.-]+/g);
			$.ajax({
				url: sharedState.vocabularyUrl() + 'lookup/sourcecodes',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(sourcecodes),
				success: function (data) {
					// Automatically add these concepts to the active concept set
					self.initConceptSet(data);
					self.model.importedConcepts(data);
				}
			});
		}

		self.initConceptSet = function (conceptSetItems) {
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
		}

		self.clearImportedConceptSet = function (textArea) {
			$(textArea).val('');
			self.model.importedConcepts([]);
		}

		self.tabMode.subscribe(function (value) {
			switch (value) {
			case 'advanced':
				if (!self.initialized) {
					self.loading(true);

					var vocabularyDeferred = $.ajax({
						url: sharedState.vocabularyUrl() + 'vocabularies',
						success: function (data) {
							self.vocabularies(data);
						}
					});

					var domainDeferred = $.ajax({
						url: sharedState.vocabularyUrl() + 'domains',
						success: function (data) {
							self.domains(data);
						}
					});

					$.when([vocabularyDeferred, domainDeferred]).done(function () {
						self.loading(false);
						self.initialized = true;
					});
				}
				break;
			}
		});

		self.executeAdvancedSearch = function () {
			self.loading(true);

			var advancedSearch = {
				"QUERY": self.advancedQuery()
			};

			var vocabs = [];
			var vocabElements = $('[name="vocabularyId"]input:checkbox:checked');
			for (var i = 0; i < vocabElements.length; i++) {
				vocabs.push(vocabElements[i].value);
			}

			if (vocabs.length > 0) {
				advancedSearch["VOCABULARY_ID"] = vocabs;
			}

			var domains = [];
			var domainElements = $('[name="domainId"]input:checkbox:checked');
			for (var i = 0; i < domainElements.length; i++) {
				domains.push(domainElements[i].value);
			}

			if (domains.length > 0) {
				advancedSearch["DOMAIN_ID"] = domains;
			}

			if (vocabs.length == 0 && domains.length == 0 && self.advancedQuery().length == 0) {
				$('#helpErrorMessage').text('Please select criteria or enter a query string.');
				self.loading(false);
				$('#modalError').modal('show');
				return;
			}

			$.ajax({
				url: sharedState.vocabularyUrl() + 'search',
				contentType: 'application/json',
				method: 'POST',
				success: function (results) {
					self.handleSearchResults(results);
				},
				data: JSON.stringify(advancedSearch)
			});
		};

		self.executeSearch = function () {
			var query = self.currentSearchValue();
			self.loading(true);

			filters = [];
			$('#querytext').blur();

			$.ajax({
				url: sharedState.vocabularyUrl() + 'search/' + escape(query),
				success: function (results) {
					self.handleSearchResults(results);
				},
				error: function (xhr, message) {
					alert('error while searching ' + message);
				}
			});
		}

		self.handleSearchResults = function (results) {
			if (results.length == 0) {
				self.loading(false);
				$('#modalNoSearchResults').modal('show');
				return;
			}

			var densityPromise = vocabAPI.loadDensity(results);

			$.when(densityPromise).done(function () {
				self.concepts(results);
				self.loading(false);
			});
		}

		self.renderConceptSelector = function (s, p, d) {
			var css = '';
			var icon = 'fa-shopping-cart';

			if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}

		if (params.query) {
			self.executeSearch();
		}
	}

	var component = {
		viewModel: search,
		template: view
	};

	ko.components.register('search', component);
	return component;
});