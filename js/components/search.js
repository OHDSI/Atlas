define(['jquery', 'knockout', 'text!./search.html', 'vocabularyprovider', 'atlas-state', 'appConfig', 'webapi/AuthAPI', 'databindings', 'faceted-datatable', 'access-denied'], function ($, ko, view, vocabAPI, sharedState, config, authApi) {
	function search(params) {
		var self = this;
		self.model = params.model;
		self.loading = ko.observable(false);
		self.initialized = false;
		self.vocabularies = ko.observableArray();
		self.domains = ko.observableArray();
		self.tabMode = ko.observable('simple');
		self.currentSearch = ko.observable();
		self.searchExecuted = ko.observable(false);
		if (params.query) {
			self.currentSearch(params.query);
		}
		self.showAdvanced = ko.observable(false);
		self.concepts = ko.observableArray();
		self.currentSearchValue = ko.observable();
		self.feSearch = ko.observable();
		self.isAuthenticated = authApi.isAuthenticated;
		self.canSearch = ko.pureComputed(function () {
			return (config.userAuthenticationEnabled && self.isAuthenticated() && authApi.isPermittedSearch()) || !config.userAuthenticationEnabled;
		});
		self.toggleAdvanced = function () {
			self.showAdvanced(!self.showAdvanced());
		}
		self.clearAllAdvanced = function () {
			$('.advanced-options input').attr('checked', false);
		};

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

			document.location = '#/conceptset/0/details';
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
					document.location = '#/conceptset/0/details';
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
					document.location = '#/conceptset/0/details';
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

		self.onEnter = function (d, e) {
			if (e.keyCode === 13) {
				self.searchClick();
			} else {
				return true;
			}
		};

		self.searchClick = function () {
			var vocabElements = $('[name="vocabularyId"]input:checkbox:checked');
			var domainElements = $('[name="domainId"]input:checkbox:checked');

			if (vocabElements.length > 0 || domainElements.length > 0) {
				self.executeSearch();
			} else if (self.currentSearch().length > 2) {
				document.location = '#/search/' + escape(self.currentSearch());
			} else {
				alert('invalid search');
			}
		}

		self.executeSearch = function () {
			var vocabElements = $('[name="vocabularyId"]input:checkbox:checked');
			var domainElements = $('[name="domainId"]input:checkbox:checked');

			// if we don't have a search and aren't looking up domain or vocabulary details, abort.
			if (self.currentSearch() === undefined && vocabElements.length == 0 && domainElements.length == 0)
				return;

			self.searchExecuted(true);

			var query = self.currentSearch() === undefined ? '' : self.currentSearch();
			self.loading(true);

			if (vocabElements.length > 0 || domainElements.length > 0) {
				// advanced search
				var advancedSearch = {
					"QUERY": query
				};

				var vocabs = [];
				for (var i = 0; i < vocabElements.length; i++) {
					vocabs.push(vocabElements[i].value);
				}
				if (vocabs.length > 0) {
					advancedSearch["VOCABULARY_ID"] = vocabs;
				}

				var domains = [];
				for (var i = 0; i < domainElements.length; i++) {
					domains.push(domainElements[i].value);
				}
				if (domains.length > 0) {
					advancedSearch["DOMAIN_ID"] = domains;
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
			} else {
				// simple search
				$.ajax({
					url: sharedState.vocabularyUrl() + 'search/' + query,
					success: function (results) {
						self.handleSearchResults(results);
					},
					error: function (xhr, message) {
						self.loading(false);
						console.log('error while searching');
					}
				});
			}
		}

		self.handleSearchResults = function (results) {
			if (results.length == 0) {
				self.loading(false);
				self.concepts(results);
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

		var vocabularyDeferred = $.ajax({
			url: sharedState.vocabularyUrl() + 'vocabularies',
			success: function (data) {
				data = data.sort(function (a, b) {
					return (a.VOCABULARY_ID.toUpperCase() < b.VOCABULARY_ID.toUpperCase()) ? -1 : (a.VOCABULARY_ID.toUpperCase() > b.VOCABULARY_ID.toUpperCase()) ? 1 : 0;
				})
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

			if (params.query) {
				self.executeSearch();
			}
		});
	}

	var component = {
		viewModel: search,
		template: view
	};

	ko.components.register('search', component);
	return component;
});
