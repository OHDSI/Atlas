define([
	'knockout',
	'text!./conceptset-expression.html',
	'providers/Component',
	'providers/AutoBind',
  'utils/CommonUtils',
  'atlas-state',
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
      
      this.allExcludedChecked = ko.pureComputed(() => {
        return this.selectedConcepts().find(item => !item.isExcluded()) === undefined;
      });
      this.allDescendantsChecked = ko.pureComputed(() => {
        return this.selectedConcepts().find(item => !item.includeDescendants()) === undefined;
      });
      this.allMappedChecked = ko.pureComputed(() => {
        return this.selectedConcepts().find(item => !item.includeMapped()) === undefined;
      });
      
    }

    toggleExcluded() {
      this.selectAllConceptSetItems(
        !this.allExcludedChecked(),
        this.allDescendantsChecked(),
        this.allMappedChecked()
      );
    }

    toggleDescendants() {
      this.selectAllConceptSetItems(
        this.allExcludedChecked(),
        !this.allDescendantsChecked(),
        this.allMappedChecked()
      );
    }

    toggleMapped() {
      this.selectAllConceptSetItems(
        this.allExcludedChecked(),
        this.allDescendantsChecked(),
        !this.allMappedChecked()
      );
    }    
    
		selectAllConceptSetItems(isExcluded = null, includeDescendants = null, includeMapped = null) {
			if (!this.canEdit()) {
				return;
			}
			this.selectedConcepts().forEach((conceptSetItem) => {
				if (isExcluded !== null) {
					conceptSetItem.isExcluded(isExcluded);
				}
				if (includeDescendants !== null) {
					conceptSetItem.includeDescendants(includeDescendants);
				}
				if (includeMapped !== null) {
					conceptSetItem.includeMapped(includeMapped);
				}
			});
			this.model.resolveConceptSetExpression();
    }    

	}

	return commonUtils.build('conceptset-expression', ConceptsetExpression, view);
});