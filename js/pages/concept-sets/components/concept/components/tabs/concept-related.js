define([
	'knockout',
	'text!./concept-related.html',
	'components/Component',
	'services/Vocabulary',
	'utils/CommonUtils',
	'utils/Renderers',
	'atlas-state',
	'services/http',
	'faceted-datatable',
	'components/conceptLegend/concept-legend',
	'components/conceptAddBox/concept-add-box',
], function (
	ko,
	view,
	Component,
	vocabularyProvider,
	commonUtils,
	renderers,
	sharedState,
	httpService,
) {
	class ConceptRelated extends Component {
		constructor(params) {
			super(params);
			this.currentConceptId = params.currentConceptId;
			this.currentConcept = params.currentConcept;
			this.hasInfoAccess = params.hasInfoAccess;
			this.isAuthenticated = params.isAuthenticated;
			this.addConcepts = params.addConcepts;
			
			this.commonUtils = commonUtils;

			this.relatedConcepts = ko.observableArray([]);
			this.isLoading = ko.observable(false);

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

			this.loadRelatedConcepts();
		}

		enhanceConcept(concept) {
			return {
				...concept,
				isSelected: ko.observable(false),
			};
		}

		async loadRelatedConcepts() {
			this.isLoading(true);

			try {
					const {data: related} = await httpService.doGet(sharedState.vocabularyUrl() + 'concept/' + this.currentConceptId() + '/related');
					const relatedConcepts = related.map(concept => this.enhanceConcept(concept))

					await vocabularyProvider.loadDensity([...relatedConcepts, this.currentConcept()]);
					this.relatedConcepts(relatedConcepts);
			} finally {
					this.isLoading(false);
			}
		}
	}

	return commonUtils.build('concept-related', ConceptRelated, view);
});
