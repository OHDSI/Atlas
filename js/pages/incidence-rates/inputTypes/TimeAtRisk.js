define(['knockout', './FieldOffset'], function (ko, FieldOffset) {

	function TimeAtRisk(data) {
		var self = this;
		data = data || {};
		console.log(data, 'd');
		self.start = new FieldOffset(data.start, 'StartDate');
		self.end = new FieldOffset(data.end, 'EndDate');

	}
	
	return TimeAtRisk;
});
