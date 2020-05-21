define(function (require, exports) {

	function DistributionTableOptions() {
		var self = this;
		
		self.filterDef = {
			Facets: [
				{
					'caption': ko.i18n('columns.domain', 'Domain'),
					'binding': function (o) {
						return o.domainId;
					}
				},
			]
		}
	}

	return DistributionTableOptions;
});
