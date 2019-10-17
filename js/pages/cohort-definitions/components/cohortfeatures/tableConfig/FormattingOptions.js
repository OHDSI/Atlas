define(function (require, exports) {
	
	var numeral = require('numeral');

	function FormattingOptions() {
		var self = this;

		self.formatDecimal2 = function (d) {
			return (Math.round(d * 100) / 100).toFixed(2);
		}

		self.numberWithCommas = function (d) {
			return numeral(d).format('0,0');
		}
	}

	return FormattingOptions;
});