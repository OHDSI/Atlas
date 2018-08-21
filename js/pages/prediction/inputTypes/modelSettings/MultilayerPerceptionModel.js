define(function (require, exports) {

    var ko = require('knockout');

	function MultilayerPerceptionModel(data) {
		var self = this;
        data = data || {};

        self.size = ko.observable(data.size || 4);
        self.alpha = ko.observable(data.ntrees || 0.00001);
        self.seed = ko.observable(data.seed || null);
    }
	
	return MultilayerPerceptionModel;
});