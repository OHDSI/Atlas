define([
	'jquery',
	'knockout',
	'text!./ConceptSetBuilderTemplate.html',
	'../InputTypes/ConceptSet',
	'../InputTypes/ConceptSetItem',
	'vocabularyprovider',
	'databindings',
	'conceptpicker/ConceptPicker',
	'faceted-datatable',
	'knockout-jqueryui/tabs',
	'css!styles/tabs.css'
], function (
		$,
		ko,
		template,
		ConceptSet,
		ConceptSetItem,
		VocabularyAPI) {

	function CodesetBuilderViewModel(params) {
			var self = this;
			params.ref(this); // assign refrence to self to ref's param

			self.conceptSets = params.conceptSets;
			self.selectedConceptSet = ko.observable();
			self.tabWidget = ko.observable();		
			self.nameHasFocus = ko.observable();
			self.isImportEnabled = ko.observable(false);
			self.isExportEnabled = ko.observable(false);
			self.importValues = ko.observable();
			self.dtApi = ko.observable(); // store reference to datatable
			self.includedConceptsComponent = ko.observable();
			self.mappedConceptsComponent = ko.observable();
		

			// model behaviors
			self.createConceptSet = function () {
				var newConceptSet = new ConceptSet();
				newConceptSet.id = self.conceptSets().length > 0 ? Math.max.apply(null, self.conceptSets().map(function (d) {
					return d.id;
				})) + 1 : 0;
				self.conceptSets.push(newConceptSet);
				self.selectedConceptSet(newConceptSet);
				self.nameHasFocus(true);
				return newConceptSet;
			}
			
			self.doImport = function() {
				var parsedItems, importedConceptSetItems;
				parsedItems = JSON.parse(self.importValues());
				
				importedConceptSetItems = parsedItems.items.map(function (item) {
					return new ConceptSetItem(item);
				});
				
				// only add new concepts.
				ixConcepts = {};
				self.selectedConceptSet().expression.items().forEach(function(item) {
					ixConcepts[item.concept.CONCEPT_ID] = true;
				});
				
				self.selectedConceptSet().expression.items(self.selectedConceptSet().expression.items().concat(importedConceptSetItems.filter(function (item){
					return !ixConcepts[item.concept.CONCEPT_ID];
				})));
				
				self.isImportEnabled(false);
			};

			self.deleteConceptSet = function () {
				self.conceptSets.remove(self.selectedConceptSet());
			}

			// concept picker handlers
			self.addConcepts = function (conceptList) {
				// only add new concepts.
				var selectedConceptSetItems = self.selectedConceptSet().expression.items;
				var ixConcepts = {};
				selectedConceptSetItems().forEach(function(item) {
					ixConcepts[item.concept.CONCEPT_ID] = true;
				});

				var importedConcepts = [];
				conceptList.forEach(function(item) {
					if (!ixConcepts[item.CONCEPT_ID])
						importedConcepts.push(item);
				});

				var newConceptSetItems = importedConcepts.map(function (c) {
					return new ConceptSetItem({
						concept: c,
						includeDescendants: true
					});
				});
				selectedConceptSetItems(selectedConceptSetItems().concat(newConceptSetItems));
			}

			self.removeSelected = function() {
				var selectedItems = self.dtApi().getSelectedData();
				self.selectedConceptSet().expression.items.removeAll(selectedItems);
			}
			
			self.renderCheckbox = function (field) {
				return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } ,css: { selected: ' + field + '} " class="fa fa-check-circle"></span>';
			}
			
			self.getConceptSetJson = function() {
				if (self.selectedConceptSet())
					return ko.toJSON(self.selectedConceptSet().expression, null, 2);
				else
					return "";
			}
			
		}

		// return compoonent definition
		return {
			viewModel: CodesetBuilderViewModel,
			template: template
		};
	});