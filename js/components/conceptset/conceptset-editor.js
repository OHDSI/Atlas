define([
	'knockout',
	'text!./conceptset-editor.html',
	'atlas-state',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/Renderers',
	'services/ConceptSet',
	'databindings',
	'bootstrap',
	'faceted-datatable',
	'components/conceptLegend/concept-legend',
], function (
	ko,
	view,
	sharedState,
	Component,
	AutoBind,
	commonUtils,
	renderers,
	conceptSetService,
) {
	class ConceptSetEditor extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.conceptSetItems = params.conceptSetItems;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.commonUtils = commonUtils;
			this.columns = [
				{ orderable: false, render: () => renderers.renderCheckbox('isSelected', this.canEditCurrentConceptSet()) },
				{ data: 'concept.CONCEPT_ID'},
				{ data: 'concept.CONCEPT_CODE'},
				{ render: commonUtils.renderBoundLink},
				{ data: 'concept.DOMAIN_ID' },
				{ data: 'concept.STANDARD_CONCEPT', visible:false },
				{ data: 'concept.STANDARD_CONCEPT_CAPTION' },
				{ orderable:false,render: () => this.renderCheckbox('isExcluded') },
				{ class:'text-center', orderable:false, searchable:false, render: () => this.renderCheckbox('includeDescendants') },
				{ class:'text-center', orderable:false, searchable:false, render: () => this.renderCheckbox('includeMapped') }];
			
			// header state
			this.conceptsForRemovalLength = ko.pureComputed(() => this.conceptSetItems().filter(row => row.isSelected()).length);
			this.areAllItemsCheckedForRemoval = ko.pureComputed(() => this.conceptsForRemovalLength() === this.conceptSetItems().length);
      this.allExcludedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.isExcluded()) === undefined;
      });
      this.allDescendantsChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeDescendants()) === undefined;
      });
      this.allMappedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeMapped()) === undefined;
      });
		}

		renderCheckbox(field) {
			return renderers.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
		}

    toggleExcluded() {
      this.selectAllConceptSetItems('isExcluded', this.allExcludedChecked());
    }

    toggleDescendants() {
      this.selectAllConceptSetItems('includeDescendants', this.allDescendantsChecked());
    }

    toggleMapped() {
      this.selectAllConceptSetItems('includeMapped', this.allMappedChecked());
    }

    toggleSelectedItemsForRemoval() {
        const areAllItemsCheckedForRemoval = this.areAllItemsCheckedForRemoval();
        this.conceptSetItems().forEach(item => item.isSelected(!areAllItemsCheckedForRemoval));
		}
		
    selectAllConceptSetItems(key, areAllSelected) {
      if (!this.canEditCurrentConceptSet()) {
        return;
      }
      this.conceptSetItems().forEach(conceptSetItem => {
        conceptSetItem[key](!areAllSelected);
      })
    }

	}

	return commonUtils.build('conceptset-editor', ConceptSetEditor, view);
});
