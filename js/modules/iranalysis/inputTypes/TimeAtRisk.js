define(['knockout', './FieldOffset'], function (ko, FieldOffset) {

	function TimeAtRisk(data) {
		var self = this;
		data = data || {};
		
		self.start = new FieldOffset(data.start);
		self.end = new FieldOffset(data.end);

	}
	
	return TimeAtRisk;
});
