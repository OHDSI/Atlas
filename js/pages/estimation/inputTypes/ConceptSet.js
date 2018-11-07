define([
    'knockout'
], function (
    ko
) {

	function ConceptSet(data) {
		var self = this;
        data = data || {};

        self.id = data.id || 0;
        self.name = data.name || "";
	}
	
	return ConceptSet;
});