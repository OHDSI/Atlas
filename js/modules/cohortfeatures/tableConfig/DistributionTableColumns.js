define(function (require, exports) {
	
	var FormattingOptions = require('./FormattingOptions');

	function DistributionTableColumns() {
		var self = this;
		
		self.formattingOptions = new FormattingOptions();

		self.columnDef = [
			{
				title: 'Covariate Id',
				data: 'covariateId',
				visible: false
			},
			{
				title: 'Covariate Name',
				data: 'covariateName'
			},
			{
				title: 'Domain',
				data: 'domainId',
				visible: true
			},
			{
				title: 'Anaylsis Id',
				data: 'analysisId',
				visible: false
			},
			{
				title: 'Analysis Name',
				data: 'analysisName',
				visible: false,
			},
			{
				title: 'Count Value',
				data: 'countValue',
				render: function(data, type, row) {
					return self.formattingOptions.numberWithCommas(data);
				}
			},
			{
				title: 'Avg',
				data: 'avgValue',
				render: function (data, type, row) {
					return self.formattingOptions.formatDecimal2(data);
				}
			},
			{
				title: 'Std Dev',
				data: 'stdevValue',
				render: function (data, type, row) {
					return self.formattingOptions.formatDecimal2(data);
				}
			},
			{
				title: 'Min',
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
				title: 'Median',
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
				title: 'Max',
				data: 'maxValue'
			},
    ];
	}

	return DistributionTableColumns;
});
