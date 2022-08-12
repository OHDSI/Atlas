define([
	'knockout',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/CsvUtils',
	'./const',
	'./utils',
	'services/Vocabulary',
	'jszip',
	'services/MomentAPI',
], function (
	ko,
	AutoBind,
	commonUtils,
	csvUtils,
	constants,
	utils,
	vocabularyService,
	JSZip,
	momentApi,
) {

	const { ViewMode } = constants;

	// define a counter that can be 'frozen' from ConceptSetStore
	const counter = () => {
		var currentValue = 0;

		const increment = () => currentValue++;
		const value = () => currentValue;

		return {increment, value};
	}
	
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
				() => this.includedConcepts() && this.includedConcepts()
					.reduce((result, item) => {
						result[item.CONCEPT_ID] = item;
          	return result;
        	}, {})
			);
			
			// the included source codes (from loadSourceCodes)
			this.includedSourcecodes = ko.observableArray([]);

			// the recommended concepts (from loadRecommended)
			this.recommendedConcepts = ko.observableArray([]);
			this.isRecommendedAvailable = ko.observable(true);
	
			// loading state of individual aspects of the concept set store
			this.resolvingConceptSetExpression = ko.observable(false);
			this.loadingSourceCodes = ko.observable(false);
			this.loadingIncluded = ko.observable(false);
			this.loadingRecommended = ko.observable(false);
			
			// metadata about this store
			this.source = props.source || "unnamed";
			this.title = props.title || "unnamed";
      
			this.resolveCount = counter(); // handle out of order resolves

			this.observer = ko.pureComputed(() => ko.toJSON(this.current() && this.current().expression.items()))
				.extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

			this.isEditable = ko.observable(false);

			this.currentConseptSetTab = ko.observable('');
		}

		clear() {
			this.current(null);
			this.includedConcepts(null);
			this.includedSourcecodes(null);
			this.recommendedConcepts(null);
			this.conceptSetInclusionIdentifiers(null);
		}
    
    clearIncluded() {
      ['includedConcepts', 'includedSourcecodes', 'recommendedConcepts', 'conceptSetInclusionIdentifiers']
				.forEach(key => this[key](null));	
			['loadingIncluded', 'loadingSourceCodes', 'loadingRecommended']
				.forEach(key => this[key](true));
    }
    
    async resolveConceptSetExpression() {
      this.clearIncluded();
      if (this.current()) {
        this.resolvingConceptSetExpression(true);
        this.resolveCount.increment();
        const currentResolve = this.resolveCount.value();
        const conceptSetExpression = this.current().expression;
        const identfiers = await vocabularyService.resolveConceptSetExpression(conceptSetExpression)
        if (currentResolve != this.resolveCount.value()) {
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
	  this.currentConseptSetTab(mode);
      if (this.resolvingConceptSetExpression() || this.conceptSetInclusionIdentifiers() == null) // do nothing
				return false;
      switch (mode) {
        case ViewMode.INCLUDED:
          this.includedConcepts() == null && await this.loadIncluded();
          break;
        case ViewMode.SOURCECODES:
          this.includedSourcecodes() == null && await this.loadSourceCodes();
          break;
				case ViewMode.RECOMMEND:
					this.recommendedConcepts() == null && await this.loadRecommended();
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
          ANCESTORS: null,
          isSelected: ko.observable(false)
        })));
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
				await vocabularyService.loadDensity(data);
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

		async loadRecommended() {
			this.loadingRecommended(true);
			this.isRecommendedAvailable(true);
			this.includedConcepts() == null && await this.loadIncluded();
			let concepts = this.includedConcepts();
			const identifiers = concepts.map(c => c.CONCEPT_ID);
			try {
				const data = await vocabularyService.getRecommendedConceptsById(identifiers);
				const includedSet = new Set(this.conceptSetInclusionIdentifiers());
				const excludedSet = new Set(this.current().expression.items().filter(i => i.isExcluded()).map(i=>i.concept.CONCEPT_ID));
				const filtered = data.filter(f => !(includedSet.has(f.CONCEPT_ID) || excludedSet.has(f.CONCEPT_ID)));
        await vocabularyService.loadDensity(filtered);
				const normalizedData = filtered.map(item => ({
					...item, 
					isSelected: ko.observable(false),
				}))
				this.recommendedConcepts(normalizedData);
				return filtered;
			} catch (err) {
				if (err.status == 501) { // NOT_IMPLEMENTED means table does not exist
					this.isRecommendedAvailable(false);
					this.recommendedConcepts([]);
				} else {
					throw(err);
				}
			} finally {
				this.loadingRecommended(false);
			}
		}

		async exportConceptSet(prefixFields = {}) {

			function formatBoolean (b) { return b ? "TRUE" : "FALSE"}

			function conceptCols(c) { 
				return {
					"Concept ID": c.CONCEPT_ID, 
					"Concept Code": c.CONCEPT_CODE, 
					"Concept Name": c.CONCEPT_NAME,
					"Domain": c.DOMAIN_ID, 
					"Vocabulary": c.VOCABULARY_ID, 
					"Standard Concept": c.STANDARD_CONCEPT,
					"Valid Start Date": momentApi.formatDateTimeWithFormat(c.VALID_START_DATE, momentApi.ISO_DATE_FORMAT),
					"Valid End Date": momentApi.formatDateTimeWithFormat(c.VALID_END_DATE, momentApi.ISO_DATE_FORMAT),
				};
			}
			
			function itemSettings(i) { 
				return {
					"Exclude": formatBoolean(ko.unwrap(i.isExcluded)), 
					"Descendants": formatBoolean(ko.unwrap(i.includeDescendants)),
					"Mapped": formatBoolean(ko.unwrap(i.includeMapped))
				};
			}

			// setup the left-most columns of result CSV
			const firstColumns = {...prefixFields, "Concept Set ID": this.current().id, "Name": this.current().name()};

			// fetch included and source codes
			this.includedConcepts() == null && await this.loadIncluded();
			this.includedSourcecodes() == null && await this.loadSourceCodes();

			const expressionRows = this.expression().items().map((item) => ({...firstColumns,  ...conceptCols(item.concept), ...itemSettings(item)}));
			const expressionCsv = csvUtils.toCsv(expressionRows);

			const includedRows = this.includedConcepts().map((ic) => ({...firstColumns, ...conceptCols(ic)}));
			const includedCsv = csvUtils.toCsv(includedRows);

			const mappedRows = this.includedSourcecodes().map((ic) => ({...firstColumns, ...conceptCols(ic)}));
			const mappedCsv = csvUtils.toCsv(mappedRows);

			const zip = new JSZip();
			zip.file("conceptSetExpression.csv", expressionCsv);
			zip.file("includedConcepts.csv", includedCsv);
			zip.file("mappedConcepts.csv", mappedCsv);

			const zipFile = await zip.generateAsync({type:"blob", compression: "DEFLATE"});
			saveAs(zipFile, `${this.current().name()}.zip`);
			
		}		
		
		static activeStores() {
			const activeKeys = Object.keys(constants.ConceptSetSources).filter(key => !!this.getStore(key).current() && this.getStore(key).isEditable());
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
		
		static incidenceRates() {
			return ConceptSetStore.getStore(constants.ConceptSetSources.incidenceRates);
		}	
	}
	
	// define a registry to contain individual stores
	const registry = {};
	
	// Define ConceptSetStore for each module with conceptSet tab

	Object.keys(constants.ConceptSetSources).forEach(k => {
		registry[k] = new ConceptSetStore({source: k});
		// freeze the object to prevent any changes to the observable references, which should not be changed.
		Object.freeze(registry[k]);
	});
	
	return ConceptSetStore;	
	
});
