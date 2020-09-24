define([
  'knockout',
  'components/conceptset/ConceptSetStore',
  'components/conceptset/utils',
  'components/Component',
  'utils/CommonUtils',
  'services/AuthAPI',
  'atlas-state',
  'appConfig',
  'const',
  'text!./concept-add-box.html',
  'less!./concept-add-box.less',
	'databindings/cohortbuilder/dropupBinding',
], (
	ko,
  ConceptSetStore,
  conceptSetUtils,
	Component,
  CommonUtils,
  AuthAPI,
  sharedState,
  config,
	globalConstants,
	view,
) => {
	
	const storeKeys = ConceptSetStore.sourceKeys();

  class ConceptAddBox extends Component {
    constructor(params) {
      super(params);
      this.activeConceptSet = params.activeConceptSet || sharedState.activeConceptSet;
      this.canCreateConceptSet = ko.pureComputed(function () {
				return ((AuthAPI.isAuthenticated() && AuthAPI.isPermittedCreateConceptset()) || !config.userAuthenticationEnabled);
			});
      this.isActive = params.isActive || ko.observable(true);
      this.onSubmit = params.onSubmit;
      this.canSelectSource = params.canSelectSource || false;
      this.isAdded = ko.observable(false);
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
  
      this.activeConceptSets = ko.pureComputed(() => {
				return ConceptSetStore.activeStores();
			});
      this.hasActiveConceptSets = ko.pureComputed(() => !!this.activeConceptSets().length);
      this.buttonText = this.hasActiveConceptSets() && this.activeConceptSet() && this.activeConceptSet().current()
        ? ko.i18n('components.conceptAddBox.addToConceptSet', 'Add To Concept Set')
        : ko.i18n('components.conceptAddBox.addToNewConceptSet', 'Add To New Concept Set');
      this.activeConceptSetName = ko.pureComputed(() => {
        if (this.activeConceptSet() && this.activeConceptSet().current()) {
          return `${this.activeConceptSet().current().name()} (${this.conceptSetType[this.activeConceptSet().source]})`;
        }
        return ko.i18n('components.conceptAddBox.selectConceptSet', 'Select Concept Set');
      });
      this.canAddConcepts = ko.pureComputed(() => {
        if (this.canSelectSource) {
          return this.hasActiveConceptSets()
            ? (this.activeConceptSet() && this.activeConceptSet().source && this.isActive() && this.activeConceptSet().isEditable())
            : this.isActive() && this.canCreateConceptSet();
        }
        return this.isActive();
      });
      this.isSuccessMessageVisible = ko.observable(false);
      this.messageTimeout = null;
      this.isDisabled = ko.pureComputed(() => !this.isActive() || !!this.isSuccessMessageVisible());
      this.buttonTooltipText = conceptSetUtils.getPermissionsText(this.hasActiveConceptSets() || this.canCreateConceptSet(), 'create');
    }
    
    handleSubmit() {
      clearTimeout(this.messageTimeout);
      this.isSuccessMessageVisible(true);
      const conceptSet = this.canSelectSource && this.activeConceptSet() ? this.activeConceptSet() : undefined;
      this.onSubmit(this.selectionOptions(), conceptSet);
      this.selectionOptions(this.defaultSelectionOptions);
      this.messageTimeout = setTimeout(() => {
        this.isSuccessMessageVisible(false);
      }, 1000);
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
