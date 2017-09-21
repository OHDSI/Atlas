define(['knockout'], function (ko) {
	
		function RestrictVisit(data) {
				var self = this;
				data = data || {};
				
				self.RestrictVisit = ko.observable(data.RestrictVisit || false);
		}
		
		return RestrictVisit;
});