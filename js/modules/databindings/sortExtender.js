define(['knockout'], function (ko) {
	ko.extenders.sorted = function (target, sortFn) {
		var result = ko.pureComputed(function () {
			return target().map(function (item) { return item; }).sort(sortFn);			
			}).extend({ notify: 'always' });
		return result;	
	}	
});