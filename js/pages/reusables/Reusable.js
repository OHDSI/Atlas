define(function (require) {

	var ko = require('knockout');
	const constants = require('const');

	class Reusable {
		constructor(d) {
			let data = d || {};
			Object.assign(this, data);
			this.name = ko.observable(data.name || ko.unwrap(constants.newEntityNames.reusable));
			this.data = "123";
			this.tags = ko.observableArray(data.tags);
		}

	}
	return Reusable;
});
