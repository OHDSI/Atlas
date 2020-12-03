define((require, exports) => {
	const ko = require('knockout');
	const datatableUtils = require('utils/DatatableUtils');
	const feAnalysisTypes = {
		PRESET: 'Preset',
		CRITERIA_SET: 'Criteria set',
		CUSTOM_FE: 'Custom'
	};
	const FeatureAnalysisFacets = [
		{
			'caption': ko.i18n('facets.caption.type', 'Type'),
			'binding': (o) => feAnalysisTypes[o.type]
		},
		{
			'caption': ko.i18n('facets.caption.domain', 'Domain'),
			'binding': (o) => datatableUtils.getFacetForDomain(o.domain),
		},
		{
			'caption': ko.i18n('facets.caption.created', 'Created'),
			'binding': (o) => datatableUtils.getFacetForDate(o.createdDate)
		},
		{
			'caption': ko.i18n('facets.caption.updated', 'Updated'),
			'binding': (o) => datatableUtils.getFacetForDate(o.modifiedDate)
		},
		{
			'caption': ko.i18n('facets.caption.author', 'Author'),
			'binding': datatableUtils.getFacetForCreatedBy,
		},
		{
			'caption': ko.i18n('facets.caption.designs', 'Designs'),
			'binding': datatableUtils.getFacetForDesign,
		},
	];

	const FeatureAnalysisColumns = (classes) => [
		{
			title: ko.i18n('columns.id', 'Id'),
			data: 'id'
		},
		{
			title: ko.i18n('columns.name', 'Name'),
			data: 'name',
			className: classes('tbl-col', 'name'),
			render: datatableUtils.getLinkFormatter(d => ({
				link: '#/cc/feature-analyses/' + d.id,
				label: d['name']
			})),
		},
		{
			title: ko.i18n('columns.description', 'Description'),
			data: 'description',
			className: classes('tbl-col', 'descr'),
		},
		{
			title: ko.i18n('columns.created', 'Created'),
			className: classes('tbl-col', 'created'),
			render: datatableUtils.getDateFieldFormatter('createdDate'),
		},
		{
			title: ko.i18n('columns.updated', 'Updated'),
			className: classes('tbl-col', 'updated'),
			render: datatableUtils.getDateFieldFormatter('modifiedDate'),
		},
		{
			title: ko.i18n('columns.author', 'Author'),
			className: classes('tbl-col', 'author'),
			data: datatableUtils.getFacetForCreatedBy,
		},

	];

	const ANY_DOMAIN = 'ANY';

	return {
			FeatureAnalysisFacets,
			FeatureAnalysisColumns,
			ANY_DOMAIN,
		};
	}
);