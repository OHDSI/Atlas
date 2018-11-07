define(['knockout'], function (ko) {

	function Cohort(data) {
		var self = this;
        data = data || {};

        self.id = data.id || 0;
        self.name = data.name || "";
	}
	
	return Cohort;
});