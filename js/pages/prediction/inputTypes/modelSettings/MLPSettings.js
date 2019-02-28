define([
	'knockout', 
	'databindings',
], function (
    ko
) {
	class MLPSettings {
        constructor(data = {}) {
            this.size = ko.observableArray((data.size && Array.isArray(data.size)) ? data.size.slice() : [4]);
            this.alpha = ko.observableArray((data.alpha && Array.isArray(data.alpha)) ? data.alpha.slice() : [0.00001]);
            this.seed = ko.observable(data.seed || null);
        }
    }
	
	return MLPSettings;
});