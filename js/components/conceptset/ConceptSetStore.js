define([
	'knockout',
	'utils/AutoBind',
	'utils/CommonUtils',
	'./const',
	'./utils',
  'services/Vocabulary',
], function (
	ko,
	AutoBind,
	commonUtils,
	constants,
	utils,
  vocabularyService,
) {

	const {ViewMode} = constants;
	
	class ConceptSetStore extends AutoBind() {

		constructor(props = {}) {
			super(props);

			this.current = ko.observable();
			this.selectedConceptsIndex = {};
			this.includedConcepts = ko.observableArray([]);
			this.includedConceptsMap = ko.observable({});
			this.includedSourcecodes = ko.observableArray([]);
			this.includedHash = ko.observable();
			this.conceptSetInclusionIdentifiers = ko.observableArray([]);
			this.currentConceptIdentifierList = ko.pureComputed(() => this.current() && this.current().expression.items().map(item => item.concept.CONCEPT_ID).join(','));
			this.currentIncludedConceptIdentifierList = ko.pureComputed(() => (this.conceptSetInclusionIdentifiers() || []).join(','));
			this.currentConceptSetExpressionJson = ko.pureComputed(() => commonUtils.syntaxHighlight(this.current() && this.current().expression));
	
			this.resolvingConceptSetExpression = ko.observable(false);
			this.loadingSourceCodes = ko.observable(false);
			this.loadingIncluded = ko.observable(false);
			this.source = props.source || "unnamed";
			this.title = props.title || "unnamed";
      
      this.resolveCount = 0; // handle out of order resolves

			this.observer = ko.pureComputed(() => ko.toJSON(this.current() && this.current().expression.items()))
				.extend({ rateLimit: { timeout: 1000, method: "notifyWhenChangesStop" } });
			
		}

		clear() {
			this.current(null);
			this.includedConcepts(null);
			this.includedConceptsMap(null);
			this.includedSourcecodes(null);
			this.includedHash(null);
			this.conceptSetInclusionIdentifiers(null);
		}
    
    clearIncluded() {
      ['includedConcepts', 'includedSourcecodes', 'conceptSetInclusionIdentifiers']
        .forEach(key => this[key](null));	
    }
    
    async resolveConceptSetExpression() {
      this.clearIncluded();
      if (this.current()) {
        this.resolvingConceptSetExpression(true);
        this.resolveCount++;
        const currentResolve = this.resolveCount;
        const conceptSetExpression = this.current().expression;
        const identfiers = await vocabularyService.resolveConceptSetExpression(conceptSetExpression)
        if (currentResolve != this.resolveCount) {
          return Promise.reject(constants.RESOLVE_OUT_OF_ORDER);
        }
        this.conceptSetInclusionIdentifiers(identfiers);
        this.resolvingConceptSetExpression(false);
        return identfiers;			
      } else {
        return null;
      }
    }
    
    async refresh(mode) {
      if (this.resolvingConceptSetExpression()) // do nothing
        return false;
      switch (mode) {
        case ViewMode.INCLUDED:
          this.includedConcepts() == null && await this.loadIncluded();
          break;
        case ViewMode.SOURCECODES:
          this.includedSourcecodes() == null && await this.loadSourceCodes();
          break;
      }
    }
		
		removeItemsByIndex(idxList) {
			const newItems = this.current().expression.items().filter((i,idx) => !idxList.includes(idx)); 
			this.current().expression.items(newItems);
		}
    
    async loadIncluded() {
      const conceptIds = this.conceptSetInclusionIdentifiers();
      try {
        this.loadingIncluded(true);
        const response = await vocabularyService.getConceptsById(conceptIds);
        await vocabularyService.loadDensity(response.data);
        this.includedConcepts((response.data || []).map(item => ({
          ...item,
          ANCESTORS: [],
          isSelected: ko.observable(false)
        })));
        const map = response.data.reduce((result, item) => {
          result[item.CONCEPT_ID] = item;
          return result;
        }, {});
        this.includedConceptsMap(map);
        await utils.loadAndApplyAncestors(this.includedConcepts(),this);
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingIncluded(false);
      }
    }
		
		async loadSourceCodes(conceptSetStore) {
			this.loadingSourceCodes(true);
      this.includedConcepts() == null && await this.loadIncluded();
			// load mapped
			let concepts = this.includedConcepts();
			const identifiers = concepts.map(c => c.CONCEPT_ID);
			try {
				const data = await vocabularyService.getMappedConceptsById(identifiers);
				const normalizedData = data.map(item => ({
					...item, 
					isSelected: ko.observable(false),
				}))
				this.includedSourcecodes(normalizedData);
				return data;
			} catch (err) {
				console.error(err);
			} finally {
				this.loadingSourceCodes(false);
			}
		}		
		
		static activeStores() {
			const activeKeys = Object.keys(constants.ConceptSetSources).filter(key => !!this.getStore(key).current());
			return activeKeys.map(k => ConceptSetStore.getStore(k));
		}
		
		static getStore(source) {
			return registry[source];
		}
		
		static sourceKeys() {
			return constants.ConceptSetSources;
		}
		
		// convienience getters
		static featureAnalysis() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.featureAnalysis);
		}

		static repository() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.repository);
		}
		
		static cohortDefinition() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.cohortDefinition);
		}

		static characterization() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.characterization);
		}
		
		static featureAnalysis() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.incidenceRates);
		}	
	}
	
	// define a registry to contain individual stores
	const registry = {};
	
	// Define ConceptSetStore for each module with conceptSet tab

	Object.keys(constants.ConceptSetSources).forEach(k => {
		registry[k] = new ConceptSetStore({source: k});
	});
	
	return ConceptSetStore;	
	
});