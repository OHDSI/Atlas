define(function (require, exports) {

	function FormattingOptions() {
		var self = this;

		self.formatDecimal2 = function (d) {
			return (Math.round(d * 100) / 100).toFixed(2);
		}

		self.numberWithCommas = function (d) {
			return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
	}

	return FormattingOptions;
});