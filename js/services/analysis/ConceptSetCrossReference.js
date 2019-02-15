define([
	'knockout',
], function (
	ko
) {
	class ConceptSetCrossReference {
        constructor(data = {}) {
            this.conceptSetId = data.conceptSetId || 0;
            this.targetName = data.targetName || "";
            this.targetIndex = data.targetIndex || 0;
            this.propertyName = data.propertyName || "";
        }
	}
	
	return ConceptSetCrossReference;
});