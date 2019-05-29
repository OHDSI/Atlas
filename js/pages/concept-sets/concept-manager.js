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
	'./PermissionService',
	'faceted-datatable',
	'components/heading',
	'less!./concept-manager.less',
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
	authApi,
	PermissionService
) {
	class ConceptManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.subscriptions = [];
			this.currentConceptId = ko.observable();
			this.hierarchyPillMode = ko.observable('all');

			this.commonUtils = commonUtils;
			this.sourceCounts = ko.observableArray();
			this.loadingSourceCounts = ko.observable(false);
			this.loadingRelated = ko.observable(true);

			this.isAuthenticated = authApi.isAuthenticated;

			this.hasInfoAccess = ko.computed(() => PermissionService.isPermittedGetInfo(sharedState.sourceKeyOfVocabUrl(), this.currentConceptId()));
			this.hasRCAccess = ko.computed(() => this.hasInfoAccess() && PermissionService.isPermittedGetRC(sharedState.sourceKeyOfVocabUrl()));

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
			this.model.currentConceptMode('details');
			this.currentConceptId(this.routerParams.conceptId);
			this.loadConcept(this.currentConceptId());
			super.onPageCreated();
		}

		onRouterParamsChanged({ conceptId }) {			
			if (conceptId !== this.currentConceptId() && conceptId !== undefined) {
				this.currentConceptId(conceptId);
				if (this.model.currentConceptMode() == 'recordcounts') {
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
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.childRelationships)) {
				metarchy.children.push(related);
			}
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.parentRelationships)) {
				metarchy.parents.push(related);
			}
		}

		async loadConcept(conceptId) {
			if (!this.hasInfoAccess()) {
				this.loadingRelated(false);
				return;
			}

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
			var currentConceptObject = _.find(related, c => c.CONCEPT_ID == this.currentConceptId());
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
