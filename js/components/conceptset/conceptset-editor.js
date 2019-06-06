define(['knockout', 'text!./conceptset-editor.html', 'atlas-state', 'databindings', 'bootstrap','faceted-datatable'], function (ko, view, sharedState) {
	function conceptsetEditor(params) {
		var self = this;
		self.model = params.model;
		self.conceptSetName = ko.observable();
		self.conceptSets = params.$raw.conceptSets();
        self.conceptSetId = params.$raw.conceptSetId;

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.toggleCheckbox = function(d, field) {
			if (self.model.canEditCurrentConceptSet()) {
			  const concept = sharedState.selectedConcepts().find(i => !!i.concept && !!d.concept && i.concept.CONCEPT_ID === d.concept.CONCEPT_ID);
			  if (!!concept) {
				  concept[field](!concept[field]());
				  self.model.resolveConceptSetExpression();
				}
			}
		  }
	  
		self.renderCheckbox = function(field) {
			return self.model.canEditCurrentConceptSet()
			  ? `<span data-bind="click: d => $component.toggleCheckbox(d, '${field}'), css: { selected: ${field} }" class="fa fa-check"></span>`
			  : `<span data-bind="css: { selected: ${field}}" class="fa fa-check readonly"></span>`;
		}
	}

	var component = {
		viewModel: conceptsetEditor,
		template: view
	};

	ko.components.register('conceptset-editor', component);
	return component;
});
