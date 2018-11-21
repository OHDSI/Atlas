define(function (require, exports) {
    var ko = require('knockout');

	function ConceptSet(data) {
		var self = this;
        data = data || {};

        self.id = data.id || 0;
        self.name = data.name || "";
	}
	
	return ConceptSet;
});