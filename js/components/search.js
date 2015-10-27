define(['knockout', 'text!./search.html', 'knockout.dataTables.binding', 'faceted-datatable'], function (ko, view) {
	function search(params) {
		var self = this;
		if (params.controller) {
			params.controller(this);
		}

		self.model = params.model;
		self.loading = ko.observable(false);
		self.advancedQuery = ko.observable('');
		self.initialized = false;
		self.vocabularies = ko.observableArray();
		self.domains = ko.observableArray();
		self.tabMode = self.model.searchTabMode;

		self.updateCurrentSearchValue = function () {
			self.model.currentSearchValue(escape(self.model.currentSearch()));
			self.model.currentSearch('');
		}

		self.model.currentSearchValue.subscribe(function (value) {
			self.executeSearch();
		});

		self.model.currentSearch.subscribe(function (query) {
			if (self.model.currentSearch().length > 2) {
				document.location='#/search/' + escape(query);
			}
		});

		self.tabMode.subscribe(function (value) {
			switch (value) {
			case 'advanced':
				if (!self.initialized) {
					self.loading(true);

					var vocabularyDeferred = $.ajax({
						url: self.model.vocabularyUrl() + 'vocabularies',
						success: function (data) {
							self.vocabularies(data);
						}
					});

					var domainDeferred = $.ajax({
						url: self.model.vocabularyUrl() + 'domains',
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
				url: self.model.vocabularyUrl() + 'search',
				contentType: 'application/json',
				method: 'POST',
				success: function (results) {
					self.handleSearchResults(results);
				},
				data: JSON.stringify(advancedSearch)
			});
		};

		self.executeSearch = function () {
			var query = self.model.currentSearchValue();
			self.loading(true);

			filters = [];
			$('#querytext').blur();

			$.ajax({
				url: self.model.vocabularyUrl() + 'search/' + escape(query),
				success: function (results) {
					var tempCaption;

					if (decodeURI(query).length > 20) {
						tempCaption = decodeURI(query).substring(0, 20) + '...';
					} else {
						tempCaption = decodeURI(query);
					}

					lastQuery = {
						query: escape(query),
						caption: tempCaption,
						resultLength: results.length
					};

					var exists = false;
					for (var i = 0; i < self.model.recentSearch().length; i++) {
						if (self.model.recentSearch()[i].query == query)
							exists = true;
					}
					if (!exists) {
						self.model.recentSearch.unshift(lastQuery);
					}
					if (self.model.recentSearch().length > 7) {
						self.model.recentSearch.pop();
					}

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

			var densityPromise = self.model.loadDensity(results);

			$.when(densityPromise).done(function () {
				self.model.searchResultsConcepts(results);
				self.tabMode('results');
				self.loading(false);
			});
		}

		self.renderConceptSelector = function (s, p, d) {
			var css = '';
			var icon = 'fa-shopping-cart';

			if (self.model.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
				css = ' selected';
			}
			return '<i class="fa ' + icon + ' ' + css + '"></i>';
		}

		if (self.model.currentSearchValue()) {
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
