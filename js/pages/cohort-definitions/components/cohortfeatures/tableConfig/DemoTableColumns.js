define(function (require, exports) {

	var FormattingOptions = require('./FormattingOptions');
	
	function DemoTableColumns() {
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
				data: 'covariateName',
				visible: false
			},
			{
				title: ko.i18n('columns.name', 'Name'),
				data: 'conceptName'
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
				searchable: true
			},
			{
				title: ko.i18n('columns.domain', 'Domain'),
				data: 'domainId',
				visible: false,
			},
			{
				title: ko.i18n('columns.timeWindow', 'Time Window'),
				data: 'timeWindow',
				visible: false,
			},
			{
				title: ko.i18n('columns.conceptId', 'Concept Id'),
				data: 'conceptId',
				visible: false
			},
			{
				title: ko.i18n('columns.countValue', 'Count Value'),
				data: 'countValue',
				render: function(data, type, row) {
					return self.formattingOptions.numberWithCommas(data);
				}
			},
			{
				title: ko.i18n('columns.perOfCohort', '% of cohort'),
				data: d => {
					return ((Math.ceil(d.statValue * 1000) / 1000) * 100).toFixed(2);
				},
			},
		];
	}

	return DemoTableColumns;
});
