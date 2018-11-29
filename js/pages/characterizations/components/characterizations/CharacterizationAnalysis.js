define(function(require, exports){

	const ko = require('knockout');

	class CharacterizationAnalysis {
		constructor(design) {
			let data = design || {};

			Object.assign(this, data);
			this.name = ko.observable(data.name);

			this.cohorts = ko.observableArray(data.cohorts);
			this.featureAnalyses = ko.observableArray(data.featureAnalyses);
			this.parameters = ko.observableArray(data.parameters);
		}
	}

	return CharacterizationAnalysis;

});