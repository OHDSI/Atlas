define([
	'knockout',
	'text!./concept-hierarchy.html',
	'components/Component',
	'services/Vocabulary',
	'services/MomentAPI',
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
	MomentApi,
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
			this.tableOptions = commonUtils.getTableOptions('M');
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
				title: ko.i18n('columns.id', 'Id'),
				data: 'CONCEPT_ID'
			}, {
				title: ko.i18n('columns.code', 'Code'),
				data: 'CONCEPT_CODE'
			}, {
				title: ko.i18n('columns.name', 'Name'),
				data: 'CONCEPT_NAME',
				render: commonUtils.renderLink,
			}, {
				title: ko.i18n('columns.class', 'Class'),
				data: 'CONCEPT_CLASS_ID'
			}, {
				title: ko.i18n('columns.standardConceptCaption', 'Standard Concept Caption'),
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			}, {
				title: ko.i18n('columns.validStartDate', 'Valid Start Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_START_DATE'] :
					MomentApi.formatDateTimeWithFormat(d['VALID_START_DATE'], MomentApi.DATE_FORMAT),
				visible: false
			}, {
				title: ko.i18n('columns.validEndDate', 'Valid End Date'),
				render: (s, type, d) => type === "sort" ? +d['VALID_END_DATE'] :
					MomentApi.formatDateTimeWithFormat(d['VALID_END_DATE'], MomentApi.DATE_FORMAT),
				visible: false
			}, {
				title: ko.i18n('columns.rc', 'RC'),
				data: 'RECORD_COUNT',
				className: 'numeric'
			}, {
				title: ko.i18n('columns.drc', 'DRC'),
				data: 'DESCENDANT_RECORD_COUNT',
				className: 'numeric'
			}, {
				title: ko.i18n('columns.distance', 'Distance'),
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
				title: ko.i18n('columns.domain', 'Domain'),
				data: 'DOMAIN_ID'
			}, {
				title: ko.i18n('columns.vocabulary', 'Vocabulary'),
				data: 'VOCABULARY_ID'
			}];

			this.hierarchyConceptsOptions = {
				Facets: [{
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.class', 'Class'),
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
				}, {
					'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT.toString()
							.replace(',', '')) > 0;
					}
				}]
			};

			this.currentConceptArray = ko.observableArray();
			this.loadHierarchyConcepts();
		}

		getSelectedConcepts(concepts) {
			return commonUtils.getSelectedConcepts(concepts);
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
