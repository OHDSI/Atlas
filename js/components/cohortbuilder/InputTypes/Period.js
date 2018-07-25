define(['knockout'], function (ko) {
	var debug = false;

	function Period(data) {
		var self = this;
		data = data || {};

		self.StartDate = ko.observable(data.StartDate === 0 ? 0 : data.StartDate || null);
		self.EndDate = ko.observable(data.EndDate === 0 ? 0 : data.EndDate || null);
	}

	Period.prototype.toJSON = function () {
		return {
			StartDate : this.StartDate instanceof Date ? (this.StartDate.toISOString().slice(0,10)) : this.StartDate,
			EndDate: this.EndDate instanceof Date ? (this.EndDate.toISOString().slice(0,10)) : this.EndDate
		}
	}
	
	return Period;
});