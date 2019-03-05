define([
	'knockout',
], function (
	ko
) {
	class ConceptSet {
        constructor(data = {}) {
            this.id = data.id || 0;
            this.name = data.name || "";
        }
	}
	
	return ConceptSet;
});