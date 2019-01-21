define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
	ko,
	RLangClass
) {
	class TrimByPsToEquipoiseArgs extends RLangClass {
		constructor(data = {}) {
			super();
			this.bounds = ko.observableArray(data.bounds || [0.25, 0.75]);
		}
	}
	
	return TrimByPsToEquipoiseArgs;
});