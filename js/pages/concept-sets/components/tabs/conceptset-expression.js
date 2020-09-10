define([
	'knockout',
	'text!./conceptset-expression.html',
	'components/Component',
	'utils/AutoBind',
  'utils/CommonUtils',
  'utils/Renderers',
  'services/ConceptSet',
  'components/conceptset/ConceptSetStore',
  'components/conceptset/utils',
  'atlas-state',
  'const',
  'components/conceptLegend/concept-legend',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  renderers,
  conceptSetService,
  ConceptSetStore,
  conceptSetUtils,
  sharedState,
  globalConstants,
) {
	class ConceptsetExpression extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.conceptSetStore = params.conceptSetStore;
      this.conceptSetItems = ko.pureComputed(() => (this.conceptSetStore.current() && this.conceptSetStore.current().expression.items()) || []);
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
      this.commonUtils = commonUtils;
      this.allExcludedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.isExcluded()) === undefined;
      });
      this.allDescendantsChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeDescendants()) === undefined;
      });
      this.allMappedChecked = ko.pureComputed(() => {
        return this.conceptSetItems().find(item => !item.includeMapped()) === undefined;
      });

			this.data = ko.pureComputed(() => this.conceptSetItems().map((item, idx) => ({ ...item, idx, isSelected: ko.observable() })));

      this.conceptsForRemovalLength = ko.pureComputed(() => this.data().filter(row => row.isSelected()).length);
      this.areAllConceptsCheckedForRemoval = ko.pureComputed(() => this.conceptsForRemovalLength() === this.data().length);
      this.buttonTooltip = conceptSetUtils.getPermissionsText(this.canEditCurrentConceptSet());

      this.columns = [
        {
          class: 'text-center',
          orderable: false,
          render: () => renderers.renderCheckbox('isSelected', this.canEditCurrentConceptSet()),
        },
        {
          data: 'concept.CONCEPT_ID',
        },
        {
          data: 'concept.CONCEPT_CODE',
        },
        {
          render: commonUtils.renderBoundLink,
        },
        {
          data: 'concept.DOMAIN_ID',
        },
        {
          data: 'concept.STANDARD_CONCEPT',
          visible: false,
        },
        {
          data: 'concept.STANDARD_CONCEPT_CAPTION',
        },
        {
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('isExcluded'),
        },
        {
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('includeDescendants'),
        },
        {
          class: 'text-center',
          orderable: false,
          render: () => this.renderCheckbox('includeMapped'),
        },
      ];
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

    normalizeData() {
      return this.selectedConcepts().map((concept, idx) => ({ ...concept, idx, isSelected: ko.observable(!!concept.isSelected) }));
    }

    renderCheckbox(field) {
      return renderers.renderConceptSetCheckbox(this.canEditCurrentConceptSet, field);
    }

    toggleSelectedConceptsForRemoval() {
        const areAllConceptsCheckedForRemoval = this.areAllConceptsCheckedForRemoval();
        this.data().forEach(concept => concept.isSelected(!areAllConceptsCheckedForRemoval));
    }

    removeConceptsFromConceptSet() {
			const idxForRemoval = this.data().filter(concept => concept.isSelected()).map(item => item.idx);
			this.conceptSetStore.removeItemsByIndex(idxForRemoval);
    }

		selectAllConceptSetItems(key, areAllSelected) {
			if (!this.canEditCurrentConceptSet()) {
				return;
      }
      this.selectedConcepts().forEach(concept => {
        concept[key](!areAllSelected);
      })
			conceptSetService.resolveConceptSetExpression({ source: globalConstants.conceptSetSources.repository });
    }

    navigateToSearchPage() {
      sharedState.activeConceptSet(this.conceptSetStore);
      commonUtils.routeTo('/search');
    }

	}

	return commonUtils.build('conceptset-expression', ConceptsetExpression, view);
});