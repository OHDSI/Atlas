define([
  'knockout',
  'text!./conceptset-compare.html',
  'services/AuthAPI',
  'services/SourceAPI',
  'components/Component',
  'utils/AutoBind',
  'utils/CommonUtils',
  'utils/CsvUtils',
  'services/Vocabulary',
  'services/MomentAPI',
  'services/CDMResultsAPI',
  'jquery',
  'atlas-state',
  'components/conceptset/ConceptSetStore',
  'components/conceptset/InputTypes/ConceptSet',
  './coneptset-compare-const',
  'components/modal',
  'components/charts/venn',
  'less!./conceptset-compare.less',
  './subtabs/compare-results-included-concepts',
  './subtabs/compare-results-included-sourcecodes',
], function (
  ko,
  view,
  authApi,
  sourceApi,
  Component,
  AutoBind,
  commonUtils,
  CsvUtils,
  vocabularyProvider,
  MomentApi,
  cdmResultsAPI,
  $,
  sharedState,
  ConceptSetStore,
  ConceptSet,
  Const
) {
  class ConceptsetCompare extends AutoBind(Component) {
    constructor(params) {
      super(params);
      this.isModalShown = ko.observable(false);
      this.saveConceptSetFn = params.saveConceptSetFn;
      this.saveConceptSetShow = params.saveConceptSetShow;
      this.currentConceptSet = ConceptSetStore.repository().current;
      this.selectedConcepts = ko.pureComputed(() => this.currentConceptSet() && this.currentConceptSet().expression.items());
      this.currentConceptSetDirtyFlag = sharedState.RepositoryConceptSet.dirtyFlag;

      // CS1 setup
      this.compareCS1Id = ko.observable(this.currentConceptSet().id);
      this.compareCS1Caption = ko.observable(this.currentConceptSet().name());
      this.compareCS1ConceptSet = ko.observable(sharedState.selectedConcepts());
      this.compareCS1ConceptSetExpression = ko.pureComputed(() => {
        if (this.currentConceptSet() && this.compareCS1Id() === this.currentConceptSet().id) {
          return ko.toJS(this.selectedConcepts());
        } else {
          return ko.toJS(this.compareCS1ConceptSet());
        }
      });
      this.compareCS1TypeFile = ko.observable(null);

      // CS2 setup
      this.compareCS2Id = ko.observable(null);
      this.compareCS2Caption = ko.observable();
      this.compareCS2ConceptSet = ko.observable(null);
      this.compareCS2ConceptSetExpression = ko.pureComputed(() => {
        if (this.currentConceptSet() && this.compareCS2Id() === this.currentConceptSet().id) {
          return ko.toJS(this.selectedConcepts());
        } else {
          return ko.toJS(this.compareCS2ConceptSet());
        }
      });
      this.compareCS2TypeFile = ko.observable(null);

      // Vocabulary sources
      this.vocabularySources = ko.computed(() => {
        const vocabularySources = [];
        sharedState.sources().forEach((source) => {
          if (source.hasVocabulary && authApi.isPermittedAccessSource(source.sourceKey)) {
            vocabularySources.push({
              sourceKey: source.sourceKey,
              sourceName: source.sourceName,
              version: source.version() || ''
            });
          }
        });
        return vocabularySources;
      });

      this.selectedVocabularyCS1 = ko.observable(null);
      this.selectedVocabularyCS2 = ko.observable(null);

      this.selectedVocabularyCS1Display = ko.pureComputed(() => {
        const selected = this.selectedVocabularyCS1();
        return selected ? `[${selected.sourceName}] ${selected.version}` : 'Select Vocabulary';
      });

      this.selectedVocabularyCS2Display = ko.pureComputed(() => {
        const selected = this.selectedVocabularyCS2();
        return selected ? `[${selected.sourceName}] ${selected.version}` : 'Select Vocabulary';
      });

      // Initialize vocabulary selections
      this.vocabularySources.subscribe((sources) => {
        if (sources.length > 0 && !this.selectedVocabularyCS1() && !this.selectedVocabularyCS2()) {
          const currentSourceKey = sharedState.sourceKeyOfVocabUrl();

          if (currentSourceKey) {
            const currentSource = sources.find(s => s.sourceKey === currentSourceKey);

            if (currentSource) {
              this.selectedVocabularyCS1(currentSource);
              this.selectedVocabularyCS2(currentSource);
            } else {
              this.selectedVocabularyCS1(sources[0]);
              this.selectedVocabularyCS2(sources[0]);
            }
          } else {
            this.selectedVocabularyCS1(sources[0]);
            this.selectedVocabularyCS2(sources[0]);
          }
        }
      });

      if (this.vocabularySources().length > 0) {
        const sources = this.vocabularySources();
        const currentSourceKey = sharedState.sourceKeyOfVocabUrl();

        if (currentSourceKey) {
          const currentSource = sources.find(s => s.sourceKey === currentSourceKey);

          if (currentSource) {
            this.selectedVocabularyCS1(currentSource);
            this.selectedVocabularyCS2(currentSource);
          } else {
            this.selectedVocabularyCS1(sources[0]);
            this.selectedVocabularyCS2(sources[0]);
          }
        } else {
          this.selectedVocabularyCS1(sources[0]);
          this.selectedVocabularyCS2(sources[0]);
        }
      }

      this.comparisonTargets = ko.observable(null);

      // Comparison state
      this.compareError = ko.pureComputed(() => {
        return (
          this.compareCS1Id() &&
          this.compareCS2Id() &&
          this.selectedVocabularyCS1() && this.selectedVocabularyCS1().sourceKey &&
          this.selectedVocabularyCS2() && this.selectedVocabularyCS2().sourceKey &&
          (
            this.compareCS1Id() === this.compareCS2Id() &&
            this.selectedVocabularyCS1().sourceKey === this.selectedVocabularyCS2().sourceKey
          )
        )
      });

      this.compareReady = ko.pureComputed(() => {
        const conceptSetsSpecifiedAndDifferentVocabOrConceptSet = (
          this.compareCS1Id() &&
          this.compareCS2Id() &&
          this.selectedVocabularyCS1() && this.selectedVocabularyCS1().sourceKey &&
          this.selectedVocabularyCS2() && this.selectedVocabularyCS2().sourceKey &&
          (
            (this.compareCS1Id() !== this.compareCS2Id()) ||
            (this.selectedVocabularyCS1().sourceKey !== this.selectedVocabularyCS2().sourceKey)
          )
        );

        let currentConceptSetClean = true;
        if (conceptSetsSpecifiedAndDifferentVocabOrConceptSet && this.currentConceptSet()) {
          if (this.compareCS1Id() === this.currentConceptSet().id ||
            this.compareCS2Id() === this.currentConceptSet().id) {
            currentConceptSetClean = !this.currentConceptSetDirtyFlag().isDirty();
          }
        }

        return (conceptSetsSpecifiedAndDifferentVocabOrConceptSet && currentConceptSetClean);
      });

      this.compareFailed = ko.observable(false);
      this.compareFailedMessage = ko.observable('');

      this.compareUnchanged = ko.pureComputed(() => {
        const conceptSetsSpecifiedAndDifferentVocabOrConceptSet = (
          this.compareCS1Id() &&
          this.compareCS2Id() &&
          this.selectedVocabularyCS1() && this.selectedVocabularyCS1().sourceKey &&
          this.selectedVocabularyCS2() && this.selectedVocabularyCS2().sourceKey &&
          (
            (this.compareCS1Id() !== this.compareCS2Id()) ||
            (this.selectedVocabularyCS1().sourceKey !== this.selectedVocabularyCS2().sourceKey)
          )
        );

        let currentComparisonCriteriaUnchanged = true;
        if (conceptSetsSpecifiedAndDifferentVocabOrConceptSet && this.comparisonTargets()) {
          currentComparisonCriteriaUnchanged = (ko.toJSON(this.comparisonTargets()) === ko.toJSON(this.getCompareTargets()));
        }

        return (conceptSetsSpecifiedAndDifferentVocabOrConceptSet && currentComparisonCriteriaUnchanged);
      });

      this.compareLoading = ko.observable(false);
      this.compareLoadingClass = ko.pureComputed(() => {
        return this.compareLoading() ? "fa fa-circle-notch fa-spin fa-lg" : "fa fa-question-circle fa-lg"
      });

      this.compareNewConceptSetName = ko.observable(this.currentConceptSet().name() + ko.i18n('cs.browser.compare.saveFromComparisonNameTail', ' - From Comparison')());
      this.conceptSetLoading = ko.observable(false);

      // Results data
      this.currentResultSource = ko.observable();
      this.resultSources = ko.computed(() => {
        const resultSources = [];
        sharedState.sources().forEach((source) => {
          if (source.hasResults && authApi.isPermittedAccessSource(source.sourceKey)) {
            resultSources.push(source);
            if (source.resultsUrl === sharedState.resultsUrl()) {
              this.currentResultSource(source);
            }
          }
        })
        return resultSources;
      });

      this.allCompareResults = ko.observable(null);
      this.includedConceptsResults = ko.pureComputed(() => (this.allCompareResults() || []).filter(r => !r.isSourceCode));
      this.sourceCodesResults = ko.pureComputed(() => (this.allCompareResults() || []).filter(r => r.isSourceCode));

      this.selectedResultsTab = ko.observable(0);
      this.resultsTabs = [
        {
          title: ko.i18n('cs.manager.tabs.includedConcepts', 'Included Concepts'),
          key: 'included-concepts',
          componentName: 'compare-results-included-concepts',
          componentParams: {
            ...params,
            results: this.includedConceptsResults,
            compareNewConceptSetName: this.compareNewConceptSetName,
            compareCS1Caption: this.compareCS1Caption,
            compareCS2Caption: this.compareCS2Caption,
            currentResultSource: this.currentResultSource,
            resultSources: this.resultSources,
            selectedVocabularyCS1: this.selectedVocabularyCS1,
            selectedVocabularyCS2: this.selectedVocabularyCS2,
          },
        },
        {
          title: ko.i18n('cs.manager.tabs.includedSourceCodes', 'Included Source Codes'),
          key: 'included-sourcecodes',
          componentName: 'compare-results-included-sourcecodes',
          componentParams: {
            ...params,
            results: this.sourceCodesResults,
            compareNewConceptSetName: this.compareNewConceptSetName,
            compareCS1Caption: this.compareCS1Caption,
            compareCS2Caption: this.compareCS2Caption,
            currentResultSource: this.currentResultSource,
            resultSources: this.resultSources,
            selectedVocabularyCS1: this.selectedVocabularyCS1,
            selectedVocabularyCS2: this.selectedVocabularyCS2,
          },
        }
      ];
    }

    chooseCS1() {
      this.isModalShown(true);
      this.targetId = this.compareCS1Id;
      this.targetCaption = this.compareCS1Caption;
      this.targetExpression = this.compareCS1ConceptSet;
      this.targetTypeFile = this.compareCS1TypeFile;
    }

    clearCS1() {
      this.compareCS1Id(null);
      this.compareCS1Caption(null);
      this.compareCS1ConceptSet(null);
      this.allCompareResults(null);
      this.compareCS1TypeFile(null);
    }

    chooseCS2() {
      this.isModalShown(true);
      this.targetId = this.compareCS2Id;
      this.targetCaption = this.compareCS2Caption;
      this.targetExpression = this.compareCS2ConceptSet;
      this.targetTypeFile = this.compareCS2TypeFile;
    }

    clearCS2() {
      this.compareCS2Id(null);
      this.compareCS2Caption(null);
      this.compareCS2ConceptSet(null);
      this.allCompareResults(null);
      this.compareCS2TypeFile(null);
    }

    prepareDataAfterUploadFile(csvParse) {
      return csvParse.map(item => {
        const { concept_name, concept_code, vocabulary_id } = item;
        return {
          concept: { VOCABULARY_ID: vocabulary_id, CONCEPT_NAME: concept_name, CONCEPT_CODE: concept_code },
          includeDescendants: false,
          includeMapped: false,
          isExcluded: false
        };
      });
    }

    async uploadCS1(e) {
      const file = e.target.files[0];
      try {
        const csvParse = await CsvUtils.csvToJson(file, Const.requiredHeader);
        const data = this.prepareDataAfterUploadFile(csvParse);
        this.compareCS1Caption(file.name);
        this.compareCS1ConceptSet(data);
        this.compareCS1Id(file.name);
        this.compareCS1TypeFile(Const.expressionType.BRIEF);
      } catch (e) {
        throw new Error(e);
      } finally {
        e.target.value = '';
      }
    }

    async uploadCS2(e) {
      const file = e.target.files[0];
      try {
        const csvParse = await CsvUtils.csvToJson(file, Const.requiredHeader);
        const data = this.prepareDataAfterUploadFile(csvParse);
        this.compareCS2Caption(file.name);
        this.compareCS2ConceptSet(data);
        this.compareCS2Id(file.name);
        this.compareCS2TypeFile(Const.expressionType.BRIEF);
      } catch (e) {
        throw new Error(e);
      } finally {
        e.target.value = '';
      }
    }

    getCompareTargets() {
      return [{
        items: this.compareCS1ConceptSetExpression()
      }, {
        items: this.compareCS2ConceptSetExpression()
      }];
    }

    compareConceptSets() {
      this.compareLoading(true);
      this.compareFailed(false);
      this.allCompareResults(null);
    
      const source1Key = this.selectedVocabularyCS1().sourceKey;
      const source2Key = this.selectedVocabularyCS2().sourceKey;
      const expression1 = { items: this.compareCS1ConceptSetExpression() };
      const expression2 = { items: this.compareCS2ConceptSetExpression() };
    
      const csTypes = [this.compareCS1TypeFile(), this.compareCS2TypeFile()];
      const hasCsvFile = csTypes[0] === Const.expressionType.BRIEF || csTypes[1] === Const.expressionType.BRIEF;
    
      let apiMethod;
    
      try {
          if (hasCsvFile) {
              // Use CSV comparison for arbitrary diff vocab
              apiMethod = vocabularyProvider.compareConceptSetsCsvOverDiffVocabularies(
                  source1Key,
                  source2Key,
                  expression1,
                  expression2,
                  csTypes[0],
                  csTypes[1]
              );
          } else {
              // Use regular comparison over diff vocabularies
              apiMethod = vocabularyProvider.compareConceptSetsOverDiffVocabularies(
                  source1Key,
                  source2Key,
                  expression1,
                  expression2,
                  true // compareSourceCodes
              );
          }
    
          Promise.resolve(apiMethod)
              .then((response) => {
                  // Extract comparisons array from the response object
                  let resolvedCompareResults;
                  
                  if (response && response.comparisons) {
                      // New response format with nested object
                      resolvedCompareResults = response.comparisons;
                      
                      // Optionally log the counts for debugging
                      console.log('Comparison counts:', {
                          cs1Concepts: response.cs1IncludedConceptsCount,
                          cs1SourceCodes: response.cs1IncludedSourceCodesCount,
                          cs2Concepts: response.cs2IncludedConceptsCount,
                          cs2SourceCodes: response.cs2IncludedSourceCodesCount
                      });
                  } else if (Array.isArray(response)) {
                      // Old response format (direct array) - backward compatibility
                      resolvedCompareResults = response;
                  } else {
                      console.error('Unexpected response format:', response);
                      this.allCompareResults(null);
                      this.compareFailed(true);
                      this.compareFailedMessage('Comparison failed: Invalid response format received.');
                      this.compareLoading(false);
                      return;
                  }
    
                  if (!Array.isArray(resolvedCompareResults)) {
                      console.error('Compare results is not an array:', resolvedCompareResults);
                      this.allCompareResults(null);
                      this.compareFailed(true);
                      this.compareFailedMessage('Comparison failed: Unable to resolve source or invalid response received.');
                      this.compareLoading(false);
                      return;
                  }
    
                  this.allCompareResults(resolvedCompareResults);
                  this.comparisonTargets(this.getCompareTargets());
                  this.compareLoading(false);
                  this.compareFailed(false);
              })
              .catch((error) => {
                  console.error('Error comparing concept sets:', error);
                  this.allCompareResults(null);
                  this.compareFailed(true);
                  this.compareFailedMessage('Comparison failed: ' + error.message);
                  this.compareLoading(false);
              });
      } catch (error) {
          console.error('Error setting up comparison:', error);
          this.compareLoading(false);
      }
    }

    compareCreateNewConceptSet() {
      const dtItems = $('#compareResultsIncludedConcepts table')
        .DataTable()
        .data()
        .toArray();
      const conceptSetItems = dtItems.map(item => {
        const conceptName = item.vocab1ConceptName || item.vocab2ConceptName;

        return {
          concept: {
            CONCEPT_CLASS_ID: item.conceptClassId,
            CONCEPT_CODE: item.conceptCode,
            CONCEPT_ID: item.conceptId,
            CONCEPT_NAME: conceptName,
            DOMAIN_ID: item.domainId,
            INVALID_REASON: null,
            INVALID_REASON_CAPTION: null,
            STANDARD_CONCEPT: null,
            STANDARD_CONCEPT_CAPTION: null,
            VOCABULARY_ID: null,
          }
        };
      });

      const conceptSet = new ConceptSet({
        id: 0,
        name: this.compareNewConceptSetName(),
        expression: {
          items: conceptSetItems
        }
      });
      this.saveConceptSetFn(conceptSet, "#txtNewConceptSetName");
      this.saveConceptSetShow(false);
    }

    async conceptsetSelected(d) {
      this.isModalShown(false);
      this.conceptSetLoading(true);
      try {
        const csExpression = await vocabularyProvider.getConceptSetExpression(d.id);
        this.targetId(d.id);
        this.targetCaption(d.name);
        this.targetExpression(csExpression.items);
        this.targetTypeFile(Const.expressionType.FULL);
      } finally {
        this.conceptSetLoading(false);
      }
    }

    showSaveNewModal() {
      this.saveConceptSetShow(true);
    }
  }

  return commonUtils.build('conceptset-compare', ConceptsetCompare, view);
});