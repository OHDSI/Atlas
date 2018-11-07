define(['knockout'], function (ko) {

	function TargetOutcomes(data) {
		var self = this;
        data = data || {};
        
        self.targetId = ko.observable(data.targetId || null);
        self.outcomeIds = ko.observableArray((data.outcomeIds && Array.isArray(data.outcomeIds)) ? data.outcomeIds : []);
	}
	
	return TargetOutcomes;
});