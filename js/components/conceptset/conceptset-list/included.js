define([
	'knockout',
	'text!./included.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/Renderers',
	'atlas-state',
	'services/ConceptSet',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	renderers,
	sharedState,
	conceptSetService,
) {

	class IncludedConcepts extends AutoBind(Component){
		constructor(params) {
			super(params);
			this.currentConceptSetSource = params.currentConceptSetSource;
			this.includedConcepts = sharedState[`${this.currentConceptSetSource}ConceptSet`].includedConcepts;
			this.commonUtils = commonUtils;
			this.loading = params.loading;
			this.includedConceptsColumns = [
				{
					title: 'Id',
					data: 'CONCEPT_ID'
				},
				{
					title: 'Code',
					data: 'CONCEPT_CODE'
				},
				{
					title: 'Name',
					data: 'CONCEPT_NAME',
					render: commonUtils.renderLink,
				},
				{
					title: 'Class',
					data: 'CONCEPT_CLASS_ID'
				},
				{
					title: 'Standard Concept Caption',
					data: 'STANDARD_CONCEPT_CAPTION',
					visible: false
				},
				{
					title: 'RC',
					data: 'RECORD_COUNT',
					className: 'numeric'
				},
				{
					title: 'DRC',
					data: 'DESCENDANT_RECORD_COUNT',
					className: 'numeric'
				},
				{
					title: 'Domain',
					data: 'DOMAIN_ID'
				},
				{
					title: 'Vocabulary',
					data: 'VOCABULARY_ID'
				},
				{
					title: 'Ancestors',
					data: 'ANCESTORS',
					render: conceptSetService.getAncestorsRenderFunction()
				},
				{
					title: 'Excluded',
					render: () => renderers.renderCheckbox('isExcluded'),
					orderable: false,
					searchable: false,
					className: 'text-center',
				},
				{
					title: 'Descendants',
					render: () => renderers.renderCheckbox('includeDescendants'),
					orderable: false,
					searchable: false,
					className: 'text-center',
				},
				{
					title: 'Mapped',
					render: () => renderers.renderCheckbox('includeMapped'),
					orderable: false,
					searchable: false,
					className: 'text-center',
				},
			];
			this.includedConceptsOptions = {
				Facets: [
					{
						'caption': 'Vocabulary',
						'binding': (o) => {
							return o.VOCABULARY_ID;
						}
					},
					{
						'caption': 'Class',
						'binding': (o) => {
							return o.CONCEPT_CLASS_ID;
						}
					},
					{
						'caption': 'Domain',
						'binding': (o) => {
							return o.DOMAIN_ID;
						}
					},
					{
						'caption': 'Standard Concept',
						'binding': (o) => {
							return o.STANDARD_CONCEPT_CAPTION;
						}
					},
					{
						'caption': 'Invalid Reason',
						'binding': (o) => {
							return o.INVALID_REASON_CAPTION;
						}
					},
					{
						'caption': 'Has Records',
						'binding': (o) => {
							return parseInt(o.RECORD_COUNT) > 0;
						}
					},
					{
						'caption': 'Has Descendant Records',
						'binding': (o) => {
							return parseInt(o.DESCENDANT_RECORD_COUNT) > 0;
						}
					},
				]
			};
		}
	}

	return commonUtils.build('conceptset-list-included', IncludedConcepts, view);
});