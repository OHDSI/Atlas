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
				title: 'Concept Id',
				data: 'conceptId',
				visible: false,
			}, 
			{
				title: 'Relationship Type',
				data: 'relationshipType'
			}, 
			{
				title: 'Distance',
				data: 'distance',
			}, 
			{
				title: 'Concept Name',
				data: 'conceptName',
				searchable: true,
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
				visible: false,
			}, 
			{
				title: 'Person Count',
				data: 'countValue',
			}, 
			{
				title: '% of cohort',
				data: d => {
					return ((Math.ceil(d.statValue * 1000) / 1000) * 100).toFixed(2);
				},
			}, 
    ];
	}

	return DomainTableFilteredColumns;
});
