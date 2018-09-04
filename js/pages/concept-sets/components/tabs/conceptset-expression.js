define([
	'knockout',
	'text!./conceptset-expression.html',
	'providers/Component',
	'providers/AutoBind',
  'utils/CommonUtils',
  'atlas-state'
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  sharedState,
) {
	class ConceptsetExpression extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.canEdit = this.model.canEditCurrentConceptSet;
      
		}

	}

	return commonUtils.build('conceptset-expression', ConceptsetExpression, view);
});