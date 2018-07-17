define(['knockout'], function (ko) {
	var debug = false;

	function Range(data) {
		var self = this;
		data = data || {};

		self.Value = ko.observable(data.Value === 0 ? 0 : data.Value || null);
		self.Extent = ko.observable(data.Extent === 0 ? 0 : data.Extent || null);
		self.Op = ko.observable(data.Op || 'gt');
	}

	Range.prototype.toJSON = function () {
		return {
			Value : this.Value instanceof Date ? (this.Value.toISOString().slice(0,10)) : this.Value,
			Extent: this.Extent instanceof Date ? (this.Extent.toISOString().slice(0,10)) : this.Extent,
			Op: this.Op
		}
	}
	
	return Range;
});