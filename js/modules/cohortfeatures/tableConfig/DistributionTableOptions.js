define(function (require, exports) {

	function DistributionTableOptions() {
		var self = this;
		
		self.filterDef = {
			Facets: [
				{
					'caption': 'Domain',
					'binding': function (o) {
						return o.domainId;
					}
				},
			]
		}
	}

	return DistributionTableOptions;
});
