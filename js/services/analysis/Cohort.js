define([
	'knockout',
], function (
	ko
) {
	class Cohort {
		constructor(data = {}) {
			this.id = data.id || 0;
			this.name = data.name || "";
		}
	}
	
	return Cohort;
});