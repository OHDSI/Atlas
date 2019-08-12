define((require, exports) => {

	const constants = require('pages/characterizations/const');
	const datatableUtils = require('utils/DatatableUtils');
	const feAnalysisTypes = {
		PRESET: 'Preset',
		CRITERIA_SET: 'Criteria set',
		CUSTOM_FE: 'Custom'
	};
	const FeatureAnalysisFacets = [
		{
			'caption': 'Type',
			'binding': (o) => feAnalysisTypes[o.type]
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
			'binding': (o) => o.createdBy || 'anonymous',
		},
	];

	const FeatureAnalysisColumns = (classes) => [
		{
			title: 'Id',
			data: 'id'
		},
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
			render: datatableUtils.getDateFieldFormatter('createdDate'),
		},
		{
			title: 'Updated',
			className: classes('tbl-col', 'updated'),
			render: datatableUtils.getDateFieldFormatter('modifiedDate'),
		},
		{
			title: 'Author',
			className: classes('tbl-col', 'author'),
			data: 'createdBy',
		},

	];

	return {
			FeatureAnalysisFacets,
			FeatureAnalysisColumns,
		};
	}
);