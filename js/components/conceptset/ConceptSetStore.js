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

			// the concept set
			this.current = ko.observable();
			this.expression = ko.pureComputed(() => this.current() && this.current().expression);
			this.currentConceptSetExpressionJson = ko.pureComputed(() => commonUtils.syntaxHighlight(this.expression()));
			
			// the concepts in the expression
			// concepts can appear more than once, the index object will keep the list of different items for each concept.
			this.selectedConceptsIndex = ko.pureComputed(() => {
				const index = this.expression() && this.expression().items()
					.reduce((result, item) => {
						const itemArr = result[item.concept.CONCEPT_ID] || [];
						itemArr.push(item);
						result[item.concept.CONCEPT_ID] = itemArr;
          	return result;
        	}, {});
				return index || {};
			});
			this.currentConceptIdentifierList = ko.pureComputed(() => Object.keys(this.selectedConceptsIndex()).join(','));
			
			// the included conceptIds (from resolveConceptSetExpression, these are guarteed to be unique)
			this.conceptSetInclusionIdentifiers = ko.observableArray();
			this.currentIncludedConceptIdentifierList = ko.pureComputed(() => (this.conceptSetInclusionIdentifiers() || []).join(','));

			// the included concetepts (from loadIncluded)
			this.includedConcepts = ko.observableArray([]);
			this.includedConceptsMap = ko.pureComputed(
				() => this.includedConcepts()
					.reduce((result, item) => {
						result[item.CONCEPT_ID] = item;
          	return result;
        	}, {})
			);
			
			// the included source codes (from loadSourceCodes)
			this.includedSourcecodes = ko.observableArray([]);
	
			// loading state of individual aspects of the concept set store
			this.resolvingConceptSetExpression = ko.observable(false);
			this.loadingSourceCodes = ko.observable(false);
			this.loadingIncluded = ko.observable(false);
			
			// metadata about this store
			this.source = props.source || "unnamed";
			this.title = props.title || "unnamed";
      
      this.resolveCount = 0; // handle out of order resolves

			this.observer = ko.pureComputed(() => ko.toJSON(this.current() && this.current().expression.items()))
				.extend({ rateLimit: { timeout: 1000, method: "notifyWhenChangesStop" } });
		}

		clear() {
			this.current(null);
			this.includedConcepts(null);
			this.includedSourcecodes(null);
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
        await utils.loadAndApplyAncestors(this.includedConcepts(),this);
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingIncluded(false);
      }
    }
		
		async loadSourceCodes() {
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