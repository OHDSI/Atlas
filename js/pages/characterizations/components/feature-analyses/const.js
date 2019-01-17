define((require, exports) => {

	const constants = require('pages/characterizations/const');
	const datatableUtils = require('utils/DatatableUtils');

	const FeatureAnalysisFacets = [
		{
			'caption': 'Type',
			'binding': (o) => constants.feAnalysisTypes[o.type]
		},
		{
			'caption': 'Domain',
			'binding': (o) => datatableUtils.getFacetForDomain(o.domain),
		},
		{
			'caption': 'Created',
			'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
		},
		{
			'caption': 'Updated',
			'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
		},
		{
			'caption': 'Author',
			'binding': datatableUtils.getFacetForCreatedBy,
		},
	];

	const FeatureAnalysisColumns = (classes) => [
		{
			title: 'Name',
			data: 'name',
			className: classes('tbl-col', 'name'),
			render: datatableUtils.getLinkFormatter(d => ({
				link: '#/cc/feature-analyses/' + d.id,
				label: d['name']
			})),
		},
		{
			title: 'Description',
			data: 'description',
			className: classes('tbl-col', 'descr'),
		},
		{
			title: 'Created',
			className: classes('tbl-col', 'created'),
			type: 'datetime-formatted',
			render: datatableUtils.getDateFieldFormatter(),
		},
		{
			title: 'Updated',
			className: classes('tbl-col', 'updated'),
			type: 'datetime-formatted',
			render: datatableUtils.getDateFieldFormatter(),
		},
		{
			title: 'Author',
			className: classes('tbl-col', 'author'),
			render: datatableUtils.getCreatedByFormatter(),
		},

	];

	return {
			FeatureAnalysisFacets,
			FeatureAnalysisColumns,
		};
	}
);