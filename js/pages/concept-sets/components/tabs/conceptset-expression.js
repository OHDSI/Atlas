define([
	'knockout',
	'text!./conceptset-expression.html',
	'providers/Component',
	'providers/AutoBind',
  'utils/CommonUtils',
  'atlas-state',
  'jquery',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  sharedState,
  $,
) {
	class ConceptsetExpression extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
			this.selectedConcepts = sharedState.selectedConcepts;
			this.canEdit = this.model.canEditCurrentConceptSet;
      
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
      // Create event handlers for all of the select all elements
      $(document).off('click', '#selectAllExclude');
      $(document).on('click', '#selectAllExclude', () => {
        this.selectAllConceptSetItems("#selectAllExclude", {
          isExcluded: true
        })
      });
      $(document).off('click', '#selectAllDescendants');
      $(document).on('click', '#selectAllDescendants', () => {
        this.selectAllConceptSetItems("#selectAllDescendants", {
          includeDescendants: true
        })
      });
      $(document).off('click', '#selectAllMapped');
      $(document).on('click', '#selectAllMapped', () => {
        this.selectAllConceptSetItems("#selectAllMapped", {
          includeMapped: true
        })
      });
    }
    
		selectAllConceptSetItems(selector, props) {
			if (!this.canEdit()) {
				return;
			}
			props = props || {};
			props.isExcluded = props.isExcluded || null;
			props.includeDescendants = props.includeDescendants || null;
			props.includeMapped = props.includeMapped || null;
			var selectAllValue = !($(selector).hasClass("selected"));
			$(selector).toggleClass("selected");
			this.selectedConcepts().forEach((conceptSetItem) => {
				if (props.isExcluded !== null) {
					conceptSetItem.isExcluded(selectAllValue);
				}
				if (props.includeDescendants !== null) {
					conceptSetItem.includeDescendants(selectAllValue);
				}
				if (props.includeMapped !== null) {
					conceptSetItem.includeMapped(selectAllValue);
				}
			});
			this.model.resolveConceptSetExpression();
    }
    
		toggleOnSelectAllCheckbox(selector, selectAllElement) {
			$(document).on('init.dt', selector, function (e, settings) {
				$(selectAllElement).addClass("selected");
			});
		}

		toggleOffSelectAllCheckbox(selector, selectAllElement) {
			$(document).on('init.dt', selector, function (e, settings) {
				$(selectAllElement).removeClass("selected");
			});
		}

	}

	return commonUtils.build('conceptset-expression', ConceptsetExpression, view);
});