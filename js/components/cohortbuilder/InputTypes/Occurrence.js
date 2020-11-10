define(['knockout'], function (ko) {

	function Occurrence(data) {
		var self = this;
		data = data || {};

		self.IsDistinct = ko.observable(data.IsDistinct || false);
		self.Type = ko.observable(data.Type===0 ? 0 : data.Type ||  2); // default to At Least
		self.Count = ko.observable(data.Count===0 ? 0 : data.Count || 1); // default to 1 count
		self.CountColumn = ko.observable(data.CountColumn);
	}
	
	return Occurrence;
});