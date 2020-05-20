// AdditoinalCriteria.js - a wrapper for criteria that is used as Additional Criteria
define(function (require, exports, module) {
	const WindowedCriteria = require('./WindowedCriteria');
	var Occurrence = require('./InputTypes/Occurrence');

	class AdditionalCriteria extends WindowedCriteria {
		constructor(data, conceptSets) {
			super(data, conceptSets);
			this.Occurrence = new Occurrence(data.Occurrence);
		}
	}

	return AdditionalCriteria;

});