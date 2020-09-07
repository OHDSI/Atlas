define([
	'knockout',
	'text!./conceptset-expression.html',
	'components/Component',
	'utils/AutoBind',
  'utils/CommonUtils',
  'services/ConceptSet',
  'atlas-state',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  conceptSetService,
  sharedState,
) {
	class ConceptsetExpression extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.selectedConcepts = sharedState.selectedConcepts;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
      this.renderConceptSetItemSelector = commonUtils.renderConceptSetItemSelector.bind(this);
      this.commonUtils = commonUtils;
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
        null,
        null
      );
    }

    toggleDescendants() {
      this.selectAllConceptSetItems(
        null,
        !this.allDescendantsChecked(),
        null
      );
    }

    toggleCheckbox(d, field) {
			commonUtils.toggleConceptSetCheckbox(
				this.canEditCurrentConceptSet,
				sharedState.selectedConcepts,
				d,
				field,
				conceptSetService.resolveConceptSetExpression
			);
    }

    renderCheckbox(field) {
      return commonUtils.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
    }


    toggleMapped() {
      this.selectAllConceptSetItems(
        null,
        null,
        !this.allMappedChecked()
      );
    }

		selectAllConceptSetItems(isExcluded = null, includeDescendants = null, includeMapped = null) {
			if (!this.canEditCurrentConceptSet()) {
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
			conceptSetService.resolveConceptSetExpression();
    }

	}

	return commonUtils.build('conceptset-expression', ConceptsetExpression, view);
});