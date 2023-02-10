define([
	'knockout',
	'text!./concept-related.html',
	'components/Component',
	'services/Vocabulary',
	'services/MomentAPI',
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
	MomentApi,
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
					'caption': ko.i18n('facets.caption.vocabulary', 'Vocabulary'),
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.standardConcept', 'Standard Concept'),
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
				}, {
					'caption': ko.i18n('facets.caption.invalidReason', 'Invalid Reason'),
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
				}, {
					'caption': ko.i18n('facets.caption.class', 'Class'),
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.domain', 'Domain'),
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
				}, {
					'caption': ko.i18n('facets.caption.relationship', 'Relationship'),
					'binding': function (o) {
						return $.map(o.RELATIONSHIPS, function (val) {
							return val.RELATIONSHIP_NAME
						});
					},
					isArray: true,
				}, {
					'caption': ko.i18n('facets.caption.hasRecords', 'Has Records'),
					'binding': function (o) {
						return parseInt(o.RECORD_COUNT) > 0;
					}
				}, {
					'caption': ko.i18n('facets.caption.hasDescendantRecords', 'Has Descendant Records'),
					'binding': function (o) {
						return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
					}
				}, {
					'caption': ko.i18n('facets.caption.distance', 'Distance'),
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

			this.loadRelatedConcepts();
		}

		getSelectedConcepts(concepts) {
			return commonUtils.getSelectedConcepts(concepts);
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
