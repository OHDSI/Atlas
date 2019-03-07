define([
	'knockout',
	'text!./concept-manager.html', 
	'pages/Page',
	'utils/AutoBind',
	'services/Vocabulary',
	'utils/CommonUtils',
	'atlas-state',
	'services/http',
	'./const',
	'services/AuthAPI',
	'faceted-datatable',
	'components/heading',
], function (
	ko,
	view,
	Page,
	AutoBind,
	vocabularyProvider,
	commonUtils,
	sharedState,
	httpService,
	constants,
	authApi
) {
	class ConceptManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.subscriptions = [];

			this.commonUtils = commonUtils;
			this.sourceCounts = ko.observableArray();
			this.loadingSourceCounts = ko.observable(false);
			this.loadingRelated = ko.observable(true);

			this.isAuthenticated = authApi.isAuthenticated;
			this.hasAccess = authApi.isPermittedReadConceptsets;

			this.subscriptions.push(
				this.model.currentConceptMode.subscribe((mode) => {
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
						return parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0;
					}
				}, {
					'caption': 'Has Descendant Records',
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0;
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
				title: '<i class="fa fa-shopping-cart"></i>',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';
					if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
			}, {
				title: 'Id',
				data: 'CONCEPT_ID'
			}, {
				title: 'Code',
				data: 'CONCEPT_CODE'
			}, {
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				}
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
					return Math.max.apply(Math, d.RELATIONSHIPS.map(function (o) {
						return o.RELATIONSHIP_DISTANCE;
					}))
				}
			}, {
				title: 'Domain',
				data: 'DOMAIN_ID'
			}, {
				title: 'Vocabulary',
				data: 'VOCABULARY_ID'
			}];
			
			this.metatrix = {
				'ICD9CM.5-dig billing code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Is a',
						range: [0, 1]
					}]
				},
				'ICD9CM.4-dig nonbill code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Is a',
						range: [0, 1]
					}, {
						name: 'Non-standard to Standard map (OMOP)',
						range: [0, 1]
					}]
				},
				'ICD9CM.3-dig nonbill code': {
					childRelationships: [{
						name: 'Subsumes',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Non-standard to Standard map (OMOP)',
						range: [0, 999]
					}]
				},
				'RxNorm.Ingredient': {
					childRelationships: [{
						name: 'Ingredient of (RxNorm)',
						range: [0, 999]
					}],
					parentRelationships: [{
						name: 'Has inferred drug class (OMOP)',
						range: [0, 999]
					}]
				},
				'RxNorm.Brand Name': {
					childRelationships: [{
						name: 'Ingredient of (RxNorm)',
						range: [0, 999]
					}],
					parentRelationships: [{
						name: 'Tradename of (RxNorm)',
						range: [0, 999]
					}]
				},
				'RxNorm.Branded Drug': {
					childRelationships: [{
						name: 'Consists of (RxNorm)',
						range: [0, 999]
					}],
					parentRelationships: [{
						name: 'Has ingredient (RxNorm)',
						range: [0, 999]
					}, {
						name: 'RxNorm to ATC (RxNorm)',
						range: [0, 999]
					}, {
						name: 'RxNorm to ETC (FDB)',
						range: [0, 999]
					}]
				},
				'RxNorm.Clinical Drug Comp': {
					childRelationships: [],
					parentRelationships: [{
						name: 'Has precise ingredient (RxNorm)',
						range: [0, 999]
					}, {
						name: 'Has ingredient (RxNorm)',
						range: [0, 999]
					}]
				},
				'CPT4.CPT4': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'CPT4.CPT4 Hierarchy': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'ETC.ETC': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'MedDRA.LLT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'MedDRA.PT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'MedDRA.HLT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'MedDRA.SOC': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'MedDRA.HLGT': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'SNOMED.Clinical Finding': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				},
				'SNOMED.Procedure': {
					childRelationships: [{
						name: 'Has descendant of',
						range: [0, 1]
					}],
					parentRelationships: [{
						name: 'Has ancestor of',
						range: [0, 1]
					}]
				}
			};

			this.currentConceptArray = ko.observableArray();
		}
		
		async onPageCreated() {
			this.currentConceptId = this.routerParams.conceptId;
			
			this.loadConcept(this.currentConceptId);
			super.onPageCreated();
		}

		onRouterParamsChanged({ conceptId }) {			
			if (conceptId !== this.currentConceptId && conceptId !== undefined) {
				if (this.model.currentConceptMode() == 'recordcounts') {
					this.loadRecordCounts();
				}
				this.loadConcept(conceptId);
				this.currentConceptId = conceptId;
			}
		}

		async fetchRecordCounts(sources) {
			const sourceData = [];
			for (const source of sources) {
				const { data } = await httpService.doPost(`${source.resultsUrl}conceptRecordCount`, [this.currentConceptId]);
				const recordCountObject = data.length > 0 ? Object.values(data[0])[0] : null;
				if (recordCountObject) {
					sourceData.push({
						sourceName: source.sourceName,
						recordCount: recordCountObject[0],
						descendantRecordCount: recordCountObject[1]
					});
				}
			}

			return sourceData;
		}

		async loadRecordCounts() {
			this.loadingSourceCounts(true);
			const sourcesWithResults = sharedState.sources().filter(source => source.hasResults);
			const sourceData = await this.fetchRecordCounts(sourcesWithResults);
			this.loadingSourceCounts(false);
			this.sourceCounts(sourceData);
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

		metagorize(metarchy, related) {
			var concept = this.model.currentConcept();
			var key = concept.VOCABULARY_ID + '.' + concept.CONCEPT_CLASS_ID;
			var meta = this.metatrix[key] || constants.defaultConceptHierarchyRelationships;
			if (this.hasRelationship(related, meta.childRelationships)) {
				metarchy.children.push(related);
			}
			if (this.hasRelationship(related, meta.parentRelationships)) {
				metarchy.parents.push(related);
			}
		}

		async loadConcept(conceptId) {
			const { data } = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + conceptId);
			var exists = false;
			for (var i = 0; i < this.model.recentConcept().length; i++) {
				if (this.model.recentConcept()[i].CONCEPT_ID == data.CONCEPT_ID)
					exists = true;
			}
			if (!exists) {
				this.model.recentConcept.unshift(data);
			}
			if (this.model.recentConcept().length > 7) {
				this.model.recentConcept.pop();
			}
			this.model.currentConcept(data);
			// load related concepts once the concept is loaded
			this.loadingRelated(true);
			this.metarchy = {
				parents: ko.observableArray(),
				children: ko.observableArray(),
				synonyms: ko.observableArray()
			};

			const { data: related } = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + conceptId + '/related');			
			for (var i = 0; i < related.length; i++) {
				this.metagorize(this.metarchy, related[i]);
			}
			
			await vocabularyProvider.loadDensity(related);
			var currentConceptObject = _.find(related, c => c.CONCEPT_ID == this.currentConceptId);
			if (currentConceptObject !== undefined){
			    this.currentConceptArray([currentConceptObject]);
			} else {
				this.currentConceptArray([]);
			}
			this.model.relatedConcepts(related);

			this.loadingRelated(false);
		}

		dispose() {
			this.subscriptions.forEach(function (subscription) {
				subscription.dispose();
			});
		}
	}

	return commonUtils.build('concept-manager', ConceptManager, view);
});
