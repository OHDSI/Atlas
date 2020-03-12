define(['knockout'], function (ko) {
	var debug = false;

	function Range(data) {
		var self = this;
		data = data || {};

		self.Value = ko.observable(data.Value === 0 ? 0 : data.Value || null);
		self.Extent = ko.observable(data.Extent === 0 ? 0 : data.Extent || null);
		self.Op = ko.observable(data.Op || 'gt');
	}

	function getCorrectDate(value) {
		// Prevent changing of string represantion due to timezone offset
		// Without this code value "2020-03-29" in date picker will be converted to string "2020-03-28" or "2020-03-30"
		const offset = value.getTimezoneOffset() * 60000;
		return new Date(value.getTime() - offset);
	}

	Range.prototype.toJSON = function () {
		return {
			Value : this.Value instanceof Date ? (getCorrectDate(this.Value).toISOString().slice(0,10)) : this.Value,
			Extent: this.Extent instanceof Date ? (getCorrectDate(this.Extent).toISOString().slice(0,10)) : this.Extent,
			Op: this.Op
		}
	}
	
	return Range;
});