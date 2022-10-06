define(['jquery','knockout', 'text!./ConceptPickerTemplate.html', './InputTypes/Concept', 'services/VocabularyProvider', 'assets/knockout-jqueryui/dialog', 'less!./conceptpicker.less'], function ($, ko, template, Concept, VocabularyProvider) {
	
	function _mapConceptRowToConcept (row)
	{
		return new Concept({
			CONCEPT_ID: row.CONCEPT_ID,
			CONCEPT_NAME: row.CONCEPT_NAME,
			CONCEPT_CODE: row.CONCEPT_CODE,
			DOMAIN_ID: row.DOMAIN_ID,
			VOCABULARY_ID: row.VOCABULARY_ID
		});			
	}
	
	function ConceptPickerViewModel(params) {
		var self = this;

		self.addHandler = params.onAdd; // callback function when add is clicked.
		self.SelectedDomain = params.DefaultDomain;
		self.DomainOptions = ko.observableArray([params.DefaultDomain]);
		self.MaxResults = params.MaxResults || 10000;
		self.isOpen = ko.observable(false);
		self.results = ko.observableArray();
		self.searchText = params.DefaultQuery || "";
		self.ProviderReady = ko.observable(false);
		self.isImportEnabled = ko.observable(false);
		self.importValues = ko.observable("");
		self.dtApi = ko.observable();

		VocabularyProvider.getDomains().then(function (domains) {
			if (self.SelectedDomain != null) {
				const domainList = domains.filter(d => d != self.SelectedDomain);
				self.DomainOptions([self.SelectedDomain].concat(domainList)); // moving selected domain to top
			} else {
				self.DomainOptions(domains);
			}

			if (params.DefaultQuery != null) {
				self.search().then(() => self.ProviderReady(true));
			} else {
				self.ProviderReady(true);
			}
		});
	};

	// need to add behavior here to add/remove concepts from the selected concepts.	
	ConceptPickerViewModel.prototype.open = function () {
		this.isOpen(true);
	};

	ConceptPickerViewModel.prototype.add = function (vm) {
		
		if (vm.addHandler && vm.dtApi())
			var concepts = vm.dtApi().getSelectedData()			
			// first map to a concept
			var mappedConcepts = concepts.map(function(d) {
				return _mapConceptRowToConcept(d);
			});
			vm.addHandler(mappedConcepts);
	};
 
 ConceptPickerViewModel.prototype.addAndClose = function(vm) {
	this.add(vm);
	this.isOpen(false);
 }

	ConceptPickerViewModel.prototype.search = function () {
		var self = this;
		searchParams = {
			QUERY: this.searchText,
			DOMAIN_ID: [this.SelectedDomain]
		}
		return VocabularyProvider.search(searchParams)
		.then(function (searchResults) {
			self.results(searchResults);
		});
	}

	ConceptPickerViewModel.prototype.searchKeyUp = function (d, e) {
		if (e.keyCode == 13) {
			this.search();
		}
	}
	
	ConceptPickerViewModel.prototype.doImport = function() {
		var self=this;
		var notFound = [];
		if (this.importValues().trim().length == 0)
		{
			self.isImportEnabled(false);
			self.importValues("");			
			return; // Nothing to do, import values is blank.
		}
		
		var importConceptIds = this.importValues().split(',').map(function (e) { return +e; });
		var uniqueConceptIds = [];
		$.each(importConceptIds, function(i, el) {
			if ($.inArray(el, uniqueConceptIds) === -1)
				uniqueConceptIds.push(el);
		});
		
		console.info(uniqueConceptIds);
		if (uniqueConceptIds.length > 0)
		{
			var results = [];
			var p = new $.Deferred().resolve();	
			uniqueConceptIds.forEach(function(cId) {
				p = p.then(function() {
					return VocabularyProvider.getConcept(cId);
				}).then(function(data) {
					if (data != "")
						results.push(_mapConceptRowToConcept(data));
					else
						notFound.push(cId);
				});
			});
			
			p.then(function(){
				if (self.addHandler)
				{
					self.addHandler(results);
				}
				self.isImportEnabled(false);
				self.importValues("");
				if (notFound.length > 0)
				{
					console.warn("The following concept ids were not found: " + notFound.join());
				}
			});
		}
		else
		{
			self.isImportEnabled(false);
			self.importValues("");			
		}
	}
	
	var component = {
		viewModel: ConceptPickerViewModel,
		template: template
	}
	
	ko.components.register('concept-picker', component);
	return component;
});
