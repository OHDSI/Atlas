define([
	'knockout',
	'utils/AutoBind',
	'utils/CommonUtils',
	'./const',
  'services/Vocabulary',
], function (
	ko,
	AutoBind,
	commonUtils,
	constants,
  VocabularyService,
) {

	class ConceptSetStore extends AutoBind() {

		constructor(props = {}) {
			super(props);

			this.current = ko.observable();
			this.negativeControls = ko.observable();
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
			this.loadingSourcecodes = ko.observable(false);
			this.loadingIncluded = ko.observable(false);
			this.source = props.source || "unnamed";
			this.title = props.title || "unnamed";
      
      this.resolveCount = 0; // handle out of order resolves

			this.observer = ko.pureComputed(() => ko.toJSON(this.current() && this.current().expression.items()))
				.extend({ rateLimit: { timeout: 1000, method: "notifyWhenChangesStop" } });
			
		}

		clear() {
			this.current(null);
			this.negativeControls(null);
			this.includedConcepts(null);
			this.includedConceptsMap(null);
			this.includedSourcecodes(null);
			this.includedHash(null);
			this.conceptSetInclusionIdentifiers(null);
		}
    
    invalidate() {
      ['includedConcepts', 'includedSourcecodes', 'conceptSetInclusionIdentifiers']
        .forEach(key => this[key](null));	
    }
    
    async resolveConceptSetExpression() {
      this.invalidate();
      if (this.current()) {
        this.resolvingConceptSetExpression(true);
        this.resolveCount++;
        const currentResolve = this.resolveCount;
        const conceptSetExpression = this.current().expression;
        const identfiers = await VocabularyService.resolveConceptSetExpression(conceptSetExpression)
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
		
		static getStore(source) {
			return registry[source];
		}
		
		static sourceKeys() {
			return constants.ConceptSetSources;
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