define(function (require, exports) {

	function DomainTableFilteredOptions() {
		var self = this;
		
		self.filterDef = {
			Facets: [
				{
					'caption': ko.i18n('columns.analysis', 'Analysis'),
					'binding': function (o) {
						return o.analysisName;
					}
				},
				{
					'caption': ko.i18n('columns.timeWindow', 'Time Window'),
					'binding': function (o) {
						return o.timeWindow;
					}
				},
			]
		}
	}

	return DomainTableFilteredOptions;
});
