define(function (require, exports) {
	
	var FormattingOptions = require('./FormattingOptions');

	function DistributionTableColumns() {
		var self = this;
		
		self.formattingOptions = new FormattingOptions();

		self.columnDef = [
			{
				title: ko.i18n('columns.covariateId', 'Covariate Id'),
				data: 'covariateId',
				visible: false
			},
			{
				title: ko.i18n('columns.covariateName', 'Covariate Name'),
				data: 'covariateName'
			},
			{
				title: ko.i18n('columns.domain', 'Domain'),
				data: 'domainId',
				visible: true
			},
			{
				title: ko.i18n('columns.analysisId', 'Anaylsis Id'),
				data: 'analysisId',
				visible: false
			},
			{
				title: ko.i18n('columns.analysisName', 'Analysis Name'),
				data: 'analysisName',
				visible: false,
			},
			{
				title: ko.i18n('columns.countValue', 'Count Value'),
				data: 'countValue',
				render: function(data, type, row) {
					return self.formattingOptions.numberWithCommas(data);
				}
			},
			{
				title: ko.i18n('columns.avgValue', 'Avg'),
				data: 'avgValue',
				render: function (data, type, row) {
					return self.formattingOptions.formatDecimal2(data);
				}
			},
			{
				title: ko.i18n('columns.stdevValue', 'Std Dev'),
				data: 'stdevValue',
				render: function (data, type, row) {
					return self.formattingOptions.formatDecimal2(data);
				}
			},
			{
				title: ko.i18n('common.min', 'Min'),
				data: 'minValue'
			},
			{
				title: 'P10',
				data: 'p10Value'
			},
			{
				title: 'P25',
				data: 'p25Value'
			},
			{
				title: ko.i18n('common.median', 'Median'),
				data: 'medianValue'
			},
			{
				title: 'P75',
				data: 'p75Value'
			},
			{
				title: 'P90',
				data: 'p90Value'
			},
			{
				title: ko.i18n('common.max', 'Max'),
				data: 'maxValue'
			},
    ];
	}

	return DistributionTableColumns;
});
