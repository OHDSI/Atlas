define(function (require, exports) {

	function DomainTableFilteredColumns() {
		var self = this;
		
		self.columnDef = [
			{
				render: function (s, p, d) {
					return `<button type="button" class="btn btn-default btn-explore">Explore</button>`;
				},
				orderable: false,
				searchable: false
			},
			{
				title: ko.i18n('columns.conceptId', 'Concept Id'),
				data: 'conceptId',
				visible: false,
			}, 
			{
				title: ko.i18n('columns.relationshipType', 'Relationship Type'),
				data: 'relationshipType'
			}, 
			{
				title: ko.i18n('columns.distance', 'Distance'),
				data: 'distance',
			}, 
			{
				title: ko.i18n('columns.conceptName', 'Concept Name'),
				data: 'conceptName',
				searchable: true,
			}, 
			{
				title: ko.i18n('columns.covariateId', 'Covariate Id'),
				data: 'covariateId',
				visible: false,
			}, 
			{
				title: ko.i18n('columns.covariateName', 'Covariate Name'),
				data: 'covariateName',
				visible: false,
			}, 
			{
				title: ko.i18n('columns.analysisId', 'Anaylsis Id'),
				data: 'analysisId',
				visible: false,
			}, 
			{
				title: ko.i18n('columns.analysisName', 'Analysis Name'),
				data: 'analysisName',
				visible: false,
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
				title: ko.i18n('columns.countValue', 'Count Value'),
				data: 'countValue',
			}, 
			{
				title: ko.i18n('columns.perOfCohort', '% of cohort'),
				data: d => {
					return ((Math.ceil(d.statValue * 1000) / 1000) * 100).toFixed(2);
				},
			}, 
    ];
	}

	return DomainTableFilteredColumns;
});
