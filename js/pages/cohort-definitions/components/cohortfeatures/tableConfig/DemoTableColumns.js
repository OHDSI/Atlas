define(function (require, exports) {

	var FormattingOptions = require('./FormattingOptions');
	
	function DemoTableColumns() {
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
				data: 'covariateName',
				visible: false
			},
			{
				title: 'Name',
				data: 'conceptName'
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
				searchable: true
			},
			{
				title: 'Domain',
				data: 'domainId',
				visible: false,
			},
			{
				title: 'Time Window',
				data: 'timeWindow',
				visible: false,
			},
			{
				title: 'Concept Id',
				data: 'conceptId',
				visible: false
			},
			{
				title: 'Count',
				data: 'countValue',
				render: function(data, type, row) {
					return self.formattingOptions.numberWithCommas(data);
				}
			},
			{
				title: '% of cohort',
				data: d => {
					return ((Math.ceil(d.statValue * 1000) / 1000) * 100).toFixed(2);
				},
			},
		];
	}

	return DemoTableColumns;
});
