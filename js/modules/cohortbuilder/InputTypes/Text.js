define(['knockout'], function (ko) {
	var debug = false;

	function Text(data) {
		var self = this;
		data = data || {};

		self.Text = ko.observable(data.Text || null);
		self.Op = ko.observable(data.Op || 'contains');
	}

	return Text;
});