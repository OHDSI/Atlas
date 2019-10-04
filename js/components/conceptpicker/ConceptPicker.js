define(['jquery','knockout', 'lodash', 'text!./ConceptPickerTemplate.html', './InputTypes/Concept', 'services/VocabularyProvider', 'assets/knockout-jqueryui/dialog', 'less!./conceptpicker.less'], function ($, ko, _, template, Concept, VocabularyProvider) {

	function _mapConceptRowToConcept (row)
	{
		return {
			concept: {
				CONCEPT_ID: row.concept.CONCEPT_ID,
				CONCEPT_NAME: row.concept.CONCEPT_NAME,
				CONCEPT_CODE: row.concept.CONCEPT_CODE,
				DOMAIN_ID: row.concept.DOMAIN_ID,
				VOCABULARY_ID: row.concept.VOCABULARY_ID,
			},
			isExcluded: row.isExcluded || false,
			includeDescendants: row.includeDescendants || false,
			includeMapped: row.includeMapped || false,
		};
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
		self.importMode = ko.observable();
		VocabularyProvider.getDomains().then(function (domains) {
			self.DomainOptions(domains);
			if (params.DefaultQuery != null) {
				self.search().then(() => self.ProviderReady(true));
			} else {
				self.ProviderReady(true);
			}
		});
	};

	ConceptPickerViewModel.prototype.openImportModal = function(importMode) {
		this.importMode(importMode);
		this.isImportEnabled(true);
	}

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
		return VocabularyProvider.search(this.searchText, {
			domains: [this.SelectedDomain],
			maxResults: this.MaxResults
		})
		.then(function (searchResults) {
			self.results(searchResults);
		});
	}

	ConceptPickerViewModel.prototype.searchKeyUp = function (d, e) {
		if (e.keyCode == 13) {
			this.search();
		}
	}

	ConceptPickerViewModel.prototype.doJSONImport = function() {
		let conceptList = [];
		try {
			conceptList = JSON.parse(this.importValues()).items || [];
		} catch (err) {
			console.error(err);
			alert('Unable to parse JSON');
			return;
		}
		conceptList = _.uniq(conceptList, i => i.concept.CONCEPT_ID);
		const result = conceptList.map(concept => _mapConceptRowToConcept(concept));
		this.isImportEnabled(false);
		this.importValues('');
		this.addHandler(result);

	}

	ConceptPickerViewModel.prototype.doIdsImport = function() {
		var self=this;
		var notFound = [];
		if (this.importValues().trim().length == 0)
		{
			self.isImportEnabled(false);
			self.importValues("");
			return; // Nothing to do, import values is blank.
		}
		var importConceptIds = this.importValues().split(',').map(i => +i).filter(i => !Number.isNaN(i));
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
						results.push(_mapConceptRowToConcept({ concept: data }));
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
