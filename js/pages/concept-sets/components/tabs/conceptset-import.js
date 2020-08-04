define([
  'knockout',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'services/AuthAPI',
  'services/Vocabulary',
  'services/ConceptSet',
  '../../PermissionService',
  'appConfig',
  '../../const',
  'text!./conceptset-import.html',
], (
  ko,
  Component,
  AutoBind,
  commonUtils,
  AuthAPI,
  VocabularyService,
  ConceptSetService,
  PermissionService,
  config,
  constants,
  view,
) => {
  class ConceptSetImport extends AutoBind(Component) {
    constructor(params) {
      super(params);

      this.currentConceptSetStore = params.currentConceptSetStore;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
      this.importModes = constants.importModes;

      this.currentConceptSet = this.currentConceptSetStore.current;

      this.error = ko.observable('');
      this.loading = ko.observable(false);
      this.currentImportMode = ko.observable(this.importModes.IDENTIFIERS.key);



      this.isAuthenticated = ko.pureComputed(() => AuthAPI.isAuthenticated);
      this.isPermittedLookupIds = ko.pureComputed(() => PermissionService.isPermittedLookupIds());
      this.isPermittedLookupCodes = ko.pureComputed(() => PermissionService.isPermittedLookupCodes());

      this.commonParams = {
        onClear: id => this.clearTextarea(id),
        isAuthenticated: this.isAuthenticated,
      }
      
      this.pills = [
        {
          ...this.commonParams,
          key: this.importModes.IDENTIFIERS.key,
          titleText: 'Enter Concept Identifiers',
          importText: 'Import Concept Identifiers',
          onImport: this.importConceptIdentifiers,
          textareaId: 'textImportConceptIdentifiers',
          isPermitted: this.isPermittedLookupIds,
        },
        {
          ...this.commonParams,
          key: this.importModes.SOURCE_CODES.key,
          titleText: 'Enter Source Codes',
          importText: 'Import Source Codes',
          onImport: this.importConceptIdentifiers,
          textareaId: 'textImportSourcecodes',
          isPermitted: this.isPermittedLookupCodes,
        },
        {
          ...this.commonParams,
          key: this.importModes.CONCEPT_SET.key,
          titleText: 'Concept Set Expression JSON',
          importText: 'Import Concept Set Expression',
          onImport: this.importConceptSet,
          textareaId: 'textImportConceptSet',
          isPermitted: () => true,
        }
      ];
    }

    async importConcepts(textareaId, method) {
      try {
        this.error('');
        this.loading(true);
        const identifiers = $(`#${textareaId}`).val().match(/[0-9]+/g); // all numeric sequences
        if (identifiers === null) {
          this.error('Unable to parse Concept Identifiers');
          this.loading(false);
        } else {
          const { data } = await VocabularyService[method](identifiers);
          const concepts = items.map(conceptSetItem => commonUtils.createConceptSetItem(conceptSetItem));
          this.appendConceptsToConceptSet(concepts);
          this.clearAndNavigate(textareaId);
        }
      } catch (err) {
        this.error(err);
      } finally {
        this.loading(false);
      }
    }

    importConceptIdentifiers(textareaId) {
      return this.importConcepts(textareaId, 'getConceptsById');
    }

    importSourceCodes(textareaId) {
      return this.importConcepts(textareaId, 'getConceptsByCode');
    }

    importConceptSet(textareaId) {
      const id = `#${textareaId}`;
      try {
        this.error('');
        this.loading(true);
        const expression = $(`#${textareaId}`).val();
        const items = JSON.parse(expression).items;
        const concepts = items.map(conceptSetItem => ConceptSetService.enhanceConceptSetItem(conceptSetItem));
        this.appendConceptsToConceptSet(concepts);
        this.clearAndNavigate(id);
      } catch (err) {
        console.log(err);
        this.error('Unable to parse JSON');
      } finally {
        this.loading(false);
      }
    }

    appendConceptsToConceptSet(concepts = []) {
      concepts.forEach(concept => {
        this.currentConceptSetStore.selectedConcepts.push(concept);
      });
      ConceptSetService.resolveConceptSetExpression({
        source: this.currentConceptSetStore.source,
      });
    }

    clearTextarea(textareaId) {
      $(`#${textareaId}`).val('');
    }

    clearAndNavigate(textareaId) {
      this.clearTextarea(textareaId);
      return commonUtils.routeTo(`#/conceptset/${this.currentConceptSet().id}/conceptset-expression`);
    }
  }

  return commonUtils.build('conceptset-import', ConceptSetImport, view);
})