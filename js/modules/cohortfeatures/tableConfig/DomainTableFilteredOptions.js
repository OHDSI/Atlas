define(function (require, exports) {

	function DomainTableFilteredOptions() {
		var self = this;
		
		self.filterDef = {
			Facets: [
				{
					'caption': 'Analysis',
					'binding': function (o) {
						return o.analysisName;
					}
				},
				{
					'caption': 'Time Window',
					'binding': function (o) {
						return o.timeWindow;
					}
				},
			]
		}
	}

	return DomainTableFilteredOptions;
});
