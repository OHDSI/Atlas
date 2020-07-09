define([
  'knockout',
  'components/Component',
  'utils/CommonUtils',
  'atlas-state',
  'const',
  'text!./concept-add-box.html',
  'less!./concept-add-box.less',
], (
  ko,
  Component,
  CommonUtils,
  sharedState,
  globalConstants,
  view,
) => {
  class ConceptAddBox extends Component {
    constructor(params) {
      super(params);
      this.isActive = params.isActive || ko.observable(true);
      this.onSubmit = params.onSubmit;
      this.canSelectSource = params.canSelectSource || false;
      this.defaultSelectionOptions = {
        includeDescendants: ko.observable(false),
        includeMapped: ko.observable(false),
        isExcluded: ko.observable(false),
      };
      this.selectionOptions = ko.observable(this.defaultSelectionOptions);

      this.activeConceptSets = ko.pureComputed(() => {
				const activeConceptSetSources = Object.keys(globalConstants.conceptSetSources).filter(key => !!sharedState[`${key}ConceptSet`].current());
				return activeConceptSetSources.map(source => sharedState[`${source}ConceptSet`]);
			});
			this.hasActiveConceptSets = ko.computed(() => !!Object.keys(this.activeConceptSets()).length);
			this.activeConceptSet = sharedState.activeConceptSet;
			this.activeConceptSetName = ko.pureComputed(() => {
				if (this.activeConceptSet() && this.activeConceptSet().current()) {
					return this.activeConceptSet().current().name(); 
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
      const source = this.canSelectSource && this.activeConceptSet() ? this.activeConceptSet().source : undefined;
      console.log('--handleSubmit')
      this.onSubmit(this.selectionOptions(), source);
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
