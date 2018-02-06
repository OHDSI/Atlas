define(function (require, exports) {
	
	var FormattingOptions = require('./FormattingOptions');

	function DomainTableColumns() {
		var self = this;
		
		self.formattingOptions = new FormattingOptions();
		
		self.columnDef = [
			{
				render: function (s, p, d) {
					return `<button type="button" class="btn btn-default btn-explore">Explore</button>`;
				},
				orderable: false,
				searchable: false
			},
			{
				title: 'Concept Id',
				data: 'conceptId',
				visible: false,
			},
			{
				title: 'Concept Name',
				data: 'conceptName',
				searchable: true
			},
			{
				title: 'Covariate Id',
				data: 'covariateId',
				visible: false,
			},
			{
				title: 'Covariate Name',
				data: 'covariateName',
				visible: false,
			},
			{
				title: 'Anaylsis Id',
				data: 'analysisId',
				visible: false,
			},
			{
				title: 'Analysis Name',
				data: 'analysisName',
				visible: false,
			},
			{
				title: 'Domain',
				data: 'domainId',
				visible: false,
			},
			{
				title: 'Time Window',
				data: 'timeWindow',
				visible: true,
			},
			{
				title: 'Person Count',
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

	return DomainTableColumns;
});
