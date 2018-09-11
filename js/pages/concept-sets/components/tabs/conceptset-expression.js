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
      
      // Initialize the select all checkboxes
      var excludeCount = 0;
      var descendantCount = 0;
      var mappedCount = 0;
      this.selectedConcepts().forEach((conceptSetItem) => {
        if (conceptSetItem.isExcluded()) {
          excludeCount++;
        }
        if (conceptSetItem.includeDescendants()) {
          descendantCount++;
        }
        if (conceptSetItem.includeMapped()) {
          mappedCount++;
        }
      });
      if (excludeCount == this.selectedConcepts().length) {
        this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
      } else {
        this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllExclude');
      }
      if (descendantCount == this.selectedConcepts().length) {
        this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
      } else {
        this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllDescendants');
      }
      if (mappedCount == this.selectedConcepts().length) {
        this.toggleOnSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
      } else {
        this.toggleOffSelectAllCheckbox('.conceptSetTable', '#selectAllMapped');
      }
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