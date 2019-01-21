define([
	'knockout',
	'services/analysis/RLangClass',
], function (
	ko,
	RLangClass
) {
	class Analysis extends RLangClass {
		constructor(data = {}) {
			super(data);
			this.analysisId = ko.observable(data.analysisId === 0 ? 0 : data.analysisId || null);
			this.description = ko.observable(data.description || null);
		}
	}
	
	return Analysis;
});