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
			'caption': ko.i18n('components.browser.facets.type', 'Type'),
			'binding': (o) => feAnalysisTypes[o.type]
		},
		{
			'caption': ko.i18n('components.browser.facets.domain', 'Domain'),
			'binding': (o) => datatableUtils.getFacetForDomain(o.domain),
		},
		{
			'caption': ko.i18n('components.browser.facets.created', 'Created'),
			'binding': (o) => datatableUtils.getFacetForDate(o.createdAt)
		},
		{
			'caption': ko.i18n('components.browser.facets.updated', 'Updated'),
			'binding': (o) => datatableUtils.getFacetForDate(o.updatedAt)
		},
		{
			'caption': ko.i18n('components.browser.facets.author', 'Author'),
			'binding': (o) => o.createdBy || 'anonymous',
		},
	];

	const FeatureAnalysisColumns = (classes) => [
		{
			title: 'Id',
			data: 'id'
		},
		{
			// title: 'Name',
			title: ko.i18n('components.browser.table.columns.name', 'Name'),
			data: 'name',
			className: classes('tbl-col', 'name'),
			render: datatableUtils.getLinkFormatter(d => ({
				link: '#/cc/feature-analyses/' + d.id,
				label: d['name']
			})),
		},
		{
			title: ko.i18n('components.browser.table.columns.description', 'Description'),
			data: 'description',
			className: classes('tbl-col', 'descr'),
		},
		{
			title: ko.i18n('components.browser.table.columns.created', 'Created'),
			className: classes('tbl-col', 'created'),
			render: datatableUtils.getDateFieldFormatter('createdDate'),
		},
		{
			title: ko.i18n('components.browser.table.columns.updated', 'Updated'),
			className: classes('tbl-col', 'updated'),
			render: datatableUtils.getDateFieldFormatter('modifiedDate'),
		},
		{
			title: ko.i18n('components.browser.table.columns.author', 'Author'),
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