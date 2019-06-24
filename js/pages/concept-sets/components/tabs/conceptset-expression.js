define([
	'knockout',
	'text!./conceptset-expression.html',
	'components/Component',
	'utils/AutoBind',
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

    toggleCheckbox(d, field) {
			commonUtils.toggleConceptSetCheckbox(
				this.canEdit, 
				sharedState.selectedConcepts, 
				d, 
				field,
				this.model.resolveConceptSetExpression
			);
    }

    renderCheckbox(field) {
      return commonUtils.renderConceptSetCheckbox(this.canEdit, field);
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