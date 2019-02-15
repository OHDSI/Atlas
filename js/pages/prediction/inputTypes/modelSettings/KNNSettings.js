define([
	'knockout', 
	'databindings',
], function (
	ko
) {
	class KNNSettings {
		constructor(data = {}) {
			this.k = ko.observable(data.k === 0 ? 0 : data.k || 1000);
		}
    }
	
	return KNNSettings;
});