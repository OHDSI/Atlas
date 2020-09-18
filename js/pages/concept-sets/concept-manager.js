define([
	'knockout',
	'text!./concept-manager.html',
	'pages/Page',
	'utils/AutoBind',
	'services/Vocabulary',
	'utils/CommonUtils',
	'services/ConceptSet',
	'components/conceptset/ConceptSetStore',
  'components/conceptset/utils',
	'utils/Renderers',
	'atlas-state',
	'services/http',
	'./const',
	'services/AuthAPI',
	'./PermissionService',
	'const',
	'faceted-datatable',
	'components/heading',
	'components/conceptLegend/concept-legend',
	'components/conceptAddBox/concept-add-box',
	'less!./concept-manager.less',
], function (
	ko,
	view,
	Page,
	AutoBind,
	vocabularyProvider,
	commonUtils,
	conceptSetService,
	ConceptSetStore,
  conceptSetUtils,
	renderers,
	sharedState,
	httpService,
	constants,
	authApi,
	PermissionService,
	globalConstants,
) {
	class ConceptManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.currentConceptId = ko.observable();
			this.currentConcept = ko.observable();

			this.currentConceptMode = ko.observable('details');
			this.hierarchyPillMode = ko.observable('all');
			this.relatedConcepts = ko.observableArray([]);
			this.commonUtils = commonUtils;
			this.renderers = renderers;
			this.sourceCounts = ko.observableArray();
			this.loadingSourceCounts = ko.observable(false);
			this.loadingRelated = ko.observable(true);
			this.isLoading = ko.observable(false);
			this.isAuthenticated = authApi.isAuthenticated;
			this.hasInfoAccess = ko.computed(() => PermissionService.isPermittedGetInfo(sharedState.sourceKeyOfVocabUrl(), this.currentConceptId()));
			this.hasRCAccess = ko.computed(() => this.hasInfoAccess() && PermissionService.isPermittedGetRC(sharedState.sourceKeyOfVocabUrl()));
			this.isCurrentConceptAddButtonActive = ko.pureComputed(() => this.currentConcept() && (this.currentConcept().includeDescendants() || this.currentConcept().includeMapped() || this.currentConcept().isExcluded()));
			this.subscriptions.push(
				this.currentConceptMode.subscribe((mode) => {
					switch (mode) {
						case 'recordcounts':
							this.loadRecordCounts();
							break;
					}
				})
			);

			this.relatedConceptsOptions = {
				Facets: [{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				}, {
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				}, {
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				}, {
					'caption': 'Relationship',
					'binding': function (o) {
						return $.map(o.RELATIONSHIPS, function (val) {
							return val.RELATIONSHIP_NAME
						});
					},
					isArray: true,
				}, {
					'caption': 'Has Records',
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				}, {
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}, {
					'caption': 'Distance',
					'binding': function (o) {
						return Math.max.apply(Math, o.RELATIONSHIPS.map(function (d) {
							return d.RELATIONSHIP_DISTANCE;
						}))
					},
				}]
			};

			this.relatedConceptsColumns = [{
				title: '',
				render: () => renderers.renderCheckbox('isSelected'),
				orderable: false,
				searchable: false,
				className: 'text-center',
			},{
				title: 'Id',
				data: 'CONCEPT_ID'
			}, {
				title: 'Code',
				data: 'CONCEPT_CODE'
			}, {
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			}, {
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			}, {
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			}, {
				title: 'RC',
				data: 'RECORD_COUNT',
				className: 'numeric'
			}, {
				title: 'DRC',
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			}, {
				title: 'Distance',
				data: function (d) {
					if (d.RELATIONSHIPS) {
						return Math.max.apply(Math, d.RELATIONSHIPS.map(function (o) {
							return o.RELATIONSHIP_DISTANCE;
						}))
					} else {
						return 0;
					}
				}
			}, {
				title: 'Domain',
				data: 'DOMAIN_ID'
			}, {
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			}];

			this.hierarchyConceptsOptions = {
				Facets: [{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': 'Has Records',
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
				}, {
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
				}]
			};

			this.currentConceptArray = ko.observableArray();
		}

		async onPageCreated() {
			this.currentConceptId(this.routerParams.conceptId);
			this.loadConcept(this.currentConceptId());
			super.onPageCreated();
		}

		onRouterParamsChanged({ conceptId }) {
			if (conceptId !== this.currentConceptId() && conceptId !== undefined) {
				this.currentConceptId(conceptId);
				if (this.currentConceptMode() == 'recordcounts') {
					this.loadRecordCounts();
				}
				this.loadConcept(this.currentConceptId());
			}
		}

		async fetchRecordCounts(sources) {
			const promises = [];
			const sourceData = [];
			for (const source of sources) {
				if (authApi.hasSourceAccess(source.sourceKey)) {
					// await is harmless here since it will pull data sequentially while it can be done in parallel
					let promise = httpService.doPost(`${source.resultsUrl}conceptRecordCount`, [this.currentConceptId()]).then(({ data }) => {
						const recordCountObject = data.length > 0 ? Object.values(data[0])[0] : null;
						if (recordCountObject) {
							sourceData.push({
								sourceName: source.sourceName,
								recordCount: recordCountObject[0],
								descendantRecordCount: recordCountObject[1]
							});
						}
					});
					promises.push(promise);
				}
			}

			await Promise.all(promises);
			return sourceData;
		}

		async loadRecordCounts() {
			this.loadingSourceCounts(true);
			const sourcesWithResults = sharedState.sources().filter(source => source.hasResults);
			const sourceData = await this.fetchRecordCounts(sourcesWithResults);
			this.loadingSourceCounts(false);
			this.sourceCounts(sourceData);
		}

    addConcept(options, conceptSetStore = ConceptSetStore.repository()) {
      // add the current concept
      const items = commonUtils.buildConceptSetItems([this.currentConcept()], options);
      conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
    }
    
    // produces a closure to wrap options and source around a function
    // that accepts the source selected concepts list
		addConcepts(options, conceptSetStore = ConceptSetStore.repository()) {
			return (conceptsArr, isCurrentConcept = false) => {
				const concepts = commonUtils.getSelectedConcepts(conceptsArr);
				const items = commonUtils.buildConceptSetItems(concepts, options);
				conceptSetUtils.addItemsToConceptSet({items, conceptSetStore});
				commonUtils.clearConceptsSelectionState(conceptsArr);
			}
		}

		hasRelationship(concept, relationships) {
			for (var r = 0; r < concept.RELATIONSHIPS.length; r++) {
				for (var i = 0; i < relationships.length; i++) {
					if (concept.RELATIONSHIPS[r].RELATIONSHIP_NAME == relationships[i].name) {
						if (concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE >= relationships[i].range[0] && concept.RELATIONSHIPS[r].RELATIONSHIP_DISTANCE <= relationships[i].range[1]) {
							return true;
						}
					}
				}
			}
			return false;
		}

		enhanceConcept(concept) {
			return {
				...concept,
				isSelected: ko.observable(false),
			};
		}

		addToConceptSetExpression(data, currentConcept = false, source = 'repository') {
			const concepts = commonUtils.getSelectedConcepts(ko.unwrap(data));
			conceptSetService.addConceptsToConceptSet({ concepts, source });
			if (currentConcept) {
				const newCurrentConceptObject = {
					...this.currentConceptArray()[0],
					...data[0],
				};
				this.currentConceptArray([newCurrentConceptObject]);
			}
		}

		toggleCurrentConcept(field) {
			this.currentConcept()[field](!this.currentConcept()[field]());
		}

		metagorize(metarchy, related) {
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.childRelationships)) {
				metarchy.children.push(related);
			}
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.parentRelationships)) {
				metarchy.parents.push(related);
			}
		}

		async loadConcept(conceptId) {
			this.isLoading(true);
			if (!this.hasInfoAccess()) {
				this.loadingRelated(false);
				return;
			}

			const { data } = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + conceptId);
			this.currentConcept(this.enhanceConcept(data));
			this.isLoading(false);
			// load related concepts once the concept is loaded
			this.loadingRelated(true);
			this.metarchy = {
				parents: ko.observableArray(),
				children: ko.observableArray(),
				synonyms: ko.observableArray()
			};

			const { data: related } = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + conceptId + '/related');
			const relatedConcepts = related.map(concept => this.enhanceConcept(concept))
			for (var i = 0; i < relatedConcepts.length; i++) {
				this.metagorize(this.metarchy, relatedConcepts[i]);
			}

			await vocabularyProvider.loadDensity([...relatedConcepts, this.currentConcept()]);
			this.currentConceptArray([this.currentConcept()]);
			this.relatedConcepts(relatedConcepts);

			this.loadingRelated(false);
		}
	}

	return commonUtils.build('concept-manager', ConceptManager, view);
});
