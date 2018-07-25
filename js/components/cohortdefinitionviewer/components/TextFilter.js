define(['knockout', 'text!./TextFilterTemplate.html'], function (ko, componentTemplate) {

	function TextFilterViewModel(params) {
		var self = this;
		self.Filter = params.Filter; // this will be a Text input type.
		
		self.operationOptions = [{
			id: 'startsWith',
			name: 'starting with'
		}, {
			id: 'contains',
			name: 'containing'
		}, {
			id: 'endsWith',
			name: 'ending with'
		}, {
			id: '!startsWith',
			name: 'not starting with'
		}, {
			id: '!contains',
			name: 'not containing'
		}, {
			id: '!endsWith',
			name: 'not ending with'
		}];
		
		self.opName = ko.pureComputed(function() {
			return self.operationOptions.filter(function(item) {
				return item.id == ko.utils.unwrapObservable(ko.utils.unwrapObservable(self.Filter).Op);
			})[0].name;
		});
		
	};

	// return compoonent definition
	return {
		viewModel: TextFilterViewModel,
		template: componentTemplate
	};

});