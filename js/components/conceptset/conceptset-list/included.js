define([
	'knockout',
	'text!./included.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'services/ConceptSet',
], function (
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	conceptSetService,
) {

	class IncludedConcepts extends AutoBind(Component){
		constructor(params) {
			super(params);
			this.includedConcepts = sharedState.includedConcepts;
			this.commonUtils = commonUtils;
			this.loading = params.loading;
			this.includedConceptsColumns = [
				{
					title: '<i class="fa fa-shopping-cart"></i>',
					render: (s, p, d) => {
						let css = '';
						let icon = 'fa-shopping-cart';
						if (sharedState.selectedConceptsIndex[d.CONCEPT_ID] === 1) {
							css = ' selected';
						}
						return '<i class="fa ' + icon + ' ' + css + '"></i>';
					},
					orderable: false,
					searchable: false
				},
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
				}
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