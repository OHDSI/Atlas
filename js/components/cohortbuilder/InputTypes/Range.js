define(['knockout', 'services/MomentAPI', 'lodash'], function (ko, momentAPI, _) {
	var debug = false;

	function Range(data) {
		var self = this;
		data = data || {};

		self.Value = ko.observable(data.Value === 0 ? 0 : data.Value || null);
		self.Extent = ko.observable(data.Extent === 0 ? 0 : data.Extent || null);
		self.Op = ko.observable(data.Op || 'gt');

		self.getPrettyValue = v => {
			const value = momentAPI.formatDateToString(ko.toJS(v));
			return _.isNil(value) ? '' : value;
		}

		self.prettyValue = ko.pureComputed(() => self.getPrettyValue(self.Value));
		self.prettyExtent = ko.pureComputed(() => self.getPrettyValue(self.Extent));
	}

	Range.prototype.toJSON = function () {
		return {
			Value : momentAPI.formatDateToString(this.Value),
			Extent: momentAPI.formatDateToString(this.Extent),
			Op: this.Op
		}
	}
	
	return Range;
});