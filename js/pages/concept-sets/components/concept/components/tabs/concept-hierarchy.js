define([
	'knockout',
	'text!./concept-hierarchy.html',
	'components/Component',
	'services/Vocabulary',
	'utils/CommonUtils',
	'utils/Renderers',
	'atlas-state',
	'services/http',
	'pages/concept-sets/const',
	'faceted-datatable',
	'components/conceptAddBox/concept-add-box',
	'less!./concept-hierarchy.less',
], function (
	ko,
	view,
	Component,
	vocabularyProvider,
	commonUtils,
	renderers,
	sharedState,
	httpService,
	constants,
) {
	class ConceptHierarchy extends Component {
		constructor(params) {
			super(params);
			this.currentConcept = params.currentConcept;
			this.currentConceptId = params.currentConceptId;
			this.hasInfoAccess = params.hasInfoAccess;
			this.isAuthenticated = params.isAuthenticated;
			this.addConcepts = params.addConcepts;

			this.hierarchyPillMode = ko.observable('all');
			this.relatedConcepts = ko.observableArray([]);
			this.commonUtils = commonUtils;
			this.isLoading =  ko.observable(false);

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
			this.loadHierarchyConcepts();
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

		metagorize(metarchy, related) {
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.childRelationships)) {
				metarchy.children.push(related);
			}
			if (this.hasRelationship(related, constants.defaultConceptHierarchyRelationships.parentRelationships)) {
				metarchy.parents.push(related);
			}
		}

		async loadHierarchyConcepts() {
			this.isLoading(true);
			try {
				this.metarchy = {
					parents: ko.observableArray(),
					children: ko.observableArray(),
					synonyms: ko.observableArray()
				};

				const {data: related} = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + this.currentConceptId() + '/ancestorAndDescendant');
				const relatedConcepts = related.map(concept => this.enhanceConcept(concept))
				for (var i = 0; i < relatedConcepts.length; i++) {
					this.metagorize(this.metarchy, relatedConcepts[i]);
				}

				let parents = this.metarchy.parents();
				let children = this.metarchy.children();

				await vocabularyProvider.loadDensity([...parents, ...children, this.currentConcept()]);
				this.currentConceptArray([this.currentConcept()]);
				this.metarchy.parents(parents);
				this.metarchy.children(children);
			} finally {
				this.isLoading(false);
			}
		}
	}

	return commonUtils.build('concept-hierarchy', ConceptHierarchy, view);
});
