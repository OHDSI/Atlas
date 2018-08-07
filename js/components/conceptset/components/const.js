define([
	'knockout',
	'atlas-state',
	'services/ConceptSetService',
],
	function(
		ko,
		sharedState,
		conceptSetService,
	){

	const searchConceptsColumns = [
		{
			title: '<i class="fa fa-shopping-cart"></i>',
			render: function (s, p, d) {
				var css = (sharedState.selectedConceptsIndex[d.CONCEPT_ID] === 1) ? ' selected' : '';
				return '<i class="fa fa-shopping-cart ' + css + '"></i>';
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
			render: function (s, p, d) {
				var valid = d.INVALID_REASON_CAPTION === 'Invalid' ? 'invalid' : '';
				return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
			}
		},
		{
			title: 'Class',
			data: 'CONCEPT_CLASS_ID'
		},
		{
			title: 'Standard Concept Caption',
			data: 'STANDARD_CONCEPT_CAPTION',
			visible: false,
			searchable: false,
		},
		{
			title: 'RC',
			data: 'RECORD_COUNT',
			className: 'numeric',
			orderable: true,
			searchable: false,
		},
		{
			title: 'DRC',
			data: 'DESCENDANT_RECORD_COUNT',
			className: 'numeric',
			orderable: true,
			searchable: false,
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
			render: conceptSetService.getAncestorsRenderFunction(),
			orderable: false,
			searchable: false,
		}];

	const searchConceptsOptions = {
		Facets: [{
			'caption': 'Vocabulary',
			'binding': (o) => o.VOCABULARY_ID,
			'field': 'VOCABULARY_ID',
			'computed': false,
		}, {
			'caption': 'Class',
			'binding': (o) => o.CONCEPT_CLASS_ID,
			'field': 'CONCEPT_CLASS_ID',
			'computed': false,
		}, {
			'caption': 'Domain',
			'binding': (o) => o.DOMAIN_ID,
			'field': 'DOMAIN_ID',
			'computed': false,
		}, {
			'caption': 'Standard Concept',
			'binding': (o) => o.STANDARD_CONCEPT_CAPTION,
			'field': 'STANDARD_CONCEPT_CAPTION',
			'computed': true,
		}, {
			'caption': 'Invalid Reason',
			'binding': (o) => o.INVALID_REASON_CAPTION,
			'field': 'INVALID_REASON_CAPTION',
			'computed': true,
		}, {
			'caption': 'Has Records',
			'binding': (o) => parseInt(o.RECORD_COUNT.toString().replace(',', '')) > 0,
			'field': 'RECORD_COUNT',
			'computed': true,
		}, {
			'caption': 'Has Descendant Records',
			'binding': (o) => parseInt(o.DESCENDANT_RECORD_COUNT.toString().replace(',', '')) > 0,
			'field': 'DESCENDANT_RECORD_COUNT',
			'computed': true,
		}]
	};

	const tableLanguage = (className) => ({
		search: 'Filter: ',
		processing: '<div><img width="100px" height="100px" src="images/loading.svg" /><div class="' + className + '">Loading...</div></div>',
	});

	return {
		searchConceptsColumns,
		searchConceptsOptions,
		tableLanguage,
	};

});