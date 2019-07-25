define([
	'knockout', 
	'text!./conceptset-editor.html', 
	'atlas-state',
	'utils/CommonUtils',
	'databindings', 
	'bootstrap',
	'faceted-datatable'
], function (
	ko, 
	view, 
	sharedState,
	commonUtils,
) {
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
			commonUtils.toggleConceptSetCheckbox(
				self.model.canEditCurrentConceptSet, 
				sharedState.selectedConcepts, 
				d, 
				field,
				self.model.resolveConceptSetExpression
			);
		  }
	  
		self.renderCheckbox = function(field) {
			return commonUtils.renderConceptSetCheckbox(self.model.canEditCurrentConceptSet, field);
		}
	}

	var component = {
		viewModel: conceptsetEditor,
		template: view
	};

	ko.components.register('conceptset-editor', component);
	return component;
});
