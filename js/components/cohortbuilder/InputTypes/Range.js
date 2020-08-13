define(['knockout', 'moment'], function (ko, moment) {
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
			Value : this.Value instanceof Date ? (moment(this.Value).toISOString(true).slice(0,10)) : this.Value,
			Extent: this.Extent instanceof Date ? (moment(this.Extent).toISOString(true).slice(0,10)) : this.Extent,
			Op: this.Op
		}
	}
	
	return Range;
});