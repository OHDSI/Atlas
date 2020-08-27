define([
  'knockout',
	'components/conceptset/ConceptSetStore',
  'components/Component',
  'utils/CommonUtils',
  'atlas-state',
  'const',
  'text!./concept-add-box.html',
  'less!./concept-add-box.less',
	'databindings/cohortbuilder/dropupBinding',
], (
	ko,
	ConceptSetStore,
	Component,
	CommonUtils,
	sharedState,
	globalConstants,
	view,
) => {
	
	const storeKeys = ConceptSetStore.sourceKeys();

  class ConceptAddBox extends Component {
    constructor(params) {
      super(params);
      this.activeConceptSet = sharedState.activeConceptSet;
      this.isActive = params.isActive || ko.observable(true);
      this.onSubmit = params.onSubmit;
      this.canSelectSource = params.canSelectSource || false;
      this.defaultSelectionOptions = {
        includeDescendants: ko.observable(false),
        includeMapped: ko.observable(false),
        isExcluded: ko.observable(false),
      };
      this.selectionOptions = ko.observable(this.defaultSelectionOptions);
      this.conceptSetType = {
        [storeKeys.repository]: 'Repository',
        [storeKeys.featureAnalysis]: 'Feature Analysis',
        [storeKeys.cohortDefinition]: 'Cohort Definition',
        [storeKeys.characterization]: 'Characterization',
        [storeKeys.incidenceRates]: 'Incidence Rates',
      };
      this.buttonText = ko.pureComputed(() => {
        if (this.activeConceptSet() && this.activeConceptSet().current()) {
          return `Add To Concept Set (${this.conceptSetType[this.activeConceptSet().source]})`;
        }
        return 'Add To New Concept Set';
      })
      this.activeConceptSets = ko.pureComputed(() => {
				return ConceptSetStore.activeStores();
			});
      this.hasActiveConceptSets = ko.pureComputed(() => !!this.activeConceptSets().length);
      this.activeConceptSetName = ko.pureComputed(() => {
        if (this.activeConceptSet() && this.activeConceptSet().current()) {
          return `${this.activeConceptSet().current().name()} (${this.conceptSetType[this.activeConceptSet().source]})`;
        }
        return 'Select Concept Set';
      });
      this.canAddConcepts = ko.pureComputed(() => {
        if (this.canSelectSource) {
          return this.hasActiveConceptSets() ? (this.activeConceptSet() && this.activeConceptSet().source && this.isActive()) : this.isActive();
        }
        return this.isActive();
      });
    }
    
    handleSubmit() {
      const conceptSet = this.canSelectSource && this.activeConceptSet() ? this.activeConceptSet() : undefined;
      this.onSubmit(this.selectionOptions(), conceptSet);
      this.selectionOptions(this.defaultSelectionOptions);
    }
    
    toggleSelectionOption(option) {
      const options = this.selectionOptions();
      this.selectionOptions({
        ...options,
        [option]: ko.observable(!options[option]()),
      });
    }

    setActiveConceptSet(conceptSet) {
      this.activeConceptSet(conceptSet);
    }

  }

  return CommonUtils.build('concept-add-box', ConceptAddBox, view);
});
