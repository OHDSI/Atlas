define([], function () {

	function NegativeControlOutcomeCohortDefinition(data) {
		var self = this;
		data = data || {};

		self.occurrenceType = ko.observable(data.occurrenceType || "all");
		self.detectOnDescendants = ko.observable(data.detectOnDescendants || true);
		self.domains  = ko.observableArray(data.domains && data.domains.map(function(d) { return d }) || ['condition','procedure']);
	}
	
	return NegativeControlOutcomeCohortDefinition;
});