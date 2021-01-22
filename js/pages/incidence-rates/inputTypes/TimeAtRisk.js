define(['knockout', './FieldOffset'], function (ko, FieldOffset) {

	function TimeAtRisk(data) {
		var self = this;
		data = data || {};

		self.start = new FieldOffset(data.start, 'StartDate');
		self.end = new FieldOffset(data.end, 'EndDate');

	}
	
	return TimeAtRisk;
});
