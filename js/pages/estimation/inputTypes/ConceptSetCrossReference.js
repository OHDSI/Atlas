define(function (require, exports) {

	function ConceptSetCrossReference(data) {
		var self = this;
        data = data || {};

        self.conceptSetId = data.conceptSetId || 0;
        self.targetName = data.targetName || "";
        self.targetIndex = data.targetIndex || 0;
        self.propertyName = data.propertyName || "";
	}
	
	return ConceptSetCrossReference;
});