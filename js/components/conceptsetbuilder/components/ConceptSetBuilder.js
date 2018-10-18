define([
	'knockout',
	'text!./ConceptSetBuilderTemplate.html',
	'../InputTypes/ConceptSet',
	'../InputTypes/ConceptSetItem',
	'services/Vocabulary',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'databindings',
	'circe',
	'conceptpicker/ConceptPicker',
	'faceted-datatable',
	'assets/knockout-jqueryui/tabs',
	'components/modal',
], function (
		ko,
		view,
		ConceptSet,
		ConceptSetItem,
		VocabularyAPI,
		Component,
		AutoBind,
		commonUtils,
	) {

		function conceptSetSorter(a,b)
		{
			var textA = a.name().toUpperCase();
			var textB = b.name().toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}
		
		class CodesetBuilder extends AutoBind(Component) {
			constructor(params) {
				super();

				params.ref(this); // assign refrence to this to ref's param
				this.rawConceptSets = params.$raw.conceptSets;

				this.conceptSets = params.conceptSets.extend({sorted: conceptSetSorter});;
				this.selectedConceptSet = ko.observable();
				this.tabWidget = ko.observable();		
				this.nameHasFocus = ko.observable();
				this.isImportEnabled = ko.observable(false);
				this.isModalOpened = ko.observable(false);
				this.isExportEnabled = ko.observable(false);
				this.isLoadEnabled = ko.observable(false);
				this.importValues = ko.observable();
				this.dtApi = ko.observable(); // store reference to datatable
				this.includedConceptsComponent = ko.observable();
				this.mappedConceptsComponent = ko.observable();			
			}		
		
			createConceptSet () {
				var newConceptSet = new ConceptSet();
				newConceptSet.id = this.conceptSets().length > 0 ? Math.max(this.conceptSets().map(d => d.id)) + 1 : 0;
				this.rawConceptSets().push(newConceptSet);
				this.selectedConceptSet(newConceptSet);
				this.nameHasFocus(true);
				return newConceptSet;
			}
			
			doImport() {
				var parsedItems, importedConceptSetItems;
				parsedItems = JSON.parse(this.importValues());
				
				importedConceptSetItems = parsedItems.items.map(item => new ConceptSetItem(item));
				
				// only add new concepts.
				const ixConcepts = {};
				this.selectedConceptSet().expression.items().forEach(item => ixConcepts[item.concept.CONCEPT_ID] = true);				
				this.selectedConceptSet().expression.items(
					this.selectedConceptSet().expression.items().concat(
						importedConceptSetItems.filter(item => !ixConcepts[item.concept.CONCEPT_ID])
					)
				);
				
				this.isImportEnabled(false);
			}

			deleteConceptSet() {
					this.rawConceptSets().remove(this.selectedConceptSet());
			}

			// concept picker handlers
			addConcepts(conceptList) {
				// only add new concepts.
				const selectedConceptSetItems = this.selectedConceptSet().expression.items;
				const ixConcepts = {};
				selectedConceptSetItems().forEach((item) => {
					ixConcepts[item.concept.CONCEPT_ID] = true;
				});

				const importedConcepts = [];
				conceptList.forEach((item) => {
					if (!ixConcepts[item.CONCEPT_ID])
						importedConcepts.push(item);
				});

				const newConceptSetItems = importedConcepts.map((c) => {
					return new ConceptSetItem({
						concept: c,
						includeDescendants: true
					});
				});
				selectedConceptSetItems(selectedConceptSetItems().concat(newConceptSetItems));
			}

			removeSelected() {
				var selectedItems = this.dtApi().getSelectedData();
				this.selectedConceptSet().expression.items.removeAll(selectedItems);
			}
			
			renderCheckbox(field) {
				return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); } ,css: { selected: ' + field + '} " class="fa fa-check"></span>';
			}
			
			getConceptSetJson() {
				if (this.selectedConceptSet())
					return ko.toJSON(this.selectedConceptSet().expression, null, 2);
				else
					return "";
			}
			
			repositoryConceptsetSelected(conceptSet) {
				VocabularyAPI.getConceptSetExpression(conceptSet.id).then((expression) => {
					var newConceptSet = this.createConceptSet();
					newConceptSet.name(conceptSet.name);
					newConceptSet.expression.items(expression.items.map(conceptSetItem => new ConceptSetItem(conceptSetItem)));
					this.isModalOpened(false);
					this.selectedConceptSet(newConceptSet);
				});
			}
				
		}

		return commonUtils.build('concept-set-builder', CodesetBuilder, view);
	});