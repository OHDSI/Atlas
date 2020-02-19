define([
	'knockout',
	'text!./conceptset-editor.html',
	'atlas-state',
	'utils/CommonUtils',
	'services/ConceptSet',
	'databindings',
	'bootstrap',
	'faceted-datatable'
], function (
	ko,
	view,
	sharedState,
	commonUtils,
	conceptSetService,
) {
	function conceptsetEditor(params) {
		var self = this;
		self.conceptSetName = ko.observable();
		self.conceptSets = params.$raw.conceptSets();
		self.conceptSetId = params.$raw.conceptSetId;
		self.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
		self.commonUtils = commonUtils;
		self.renderConceptSetItemSelector = commonUtils.renderConceptSetItemSelector.bind(this);

		self.renderLink = function (s, p, d) {
			return '<a href=\"#/conceptset/' + d.id + '/details\">' + d.name + '</a>';
		}

		self.toggleCheckbox = function(d, field) {
			commonUtils.toggleConceptSetCheckbox(
				self.canEditCurrentConceptSet,
				sharedState.selectedConcepts,
				d,
				field,
				conceptSetService.resolveConceptSetExpression
			);
		  }

		self.renderCheckbox = function(field) {
			return commonUtils.renderConceptSetCheckbox(self.canEditCurrentConceptSet, field);
		}
	}

	var component = {
		viewModel: conceptsetEditor,
		template: view
	};

	ko.components.register('conceptset-editor', component);
	return component;
});
