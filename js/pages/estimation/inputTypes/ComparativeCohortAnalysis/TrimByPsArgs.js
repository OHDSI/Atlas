define([
	'knockout', 
    'services/analysis/RLangClass',
	'databindings',
], function (
	ko,
	RLangClass
) {
	class TrimByPsArgs extends RLangClass {
		constructor(data = {}) {
			super();
			this.trimFraction = ko.observable(data.trimFraction === 0 ? 0 : data.trimFraction || 0.05).extend({ numeric: 2});
		}
	}
	
	return TrimByPsArgs;
});