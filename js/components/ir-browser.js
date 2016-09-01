define(['knockout', 
        'text!./ir-browser.html', 
        'appConfig',
        'webapi/IRAnalysisAPI',
        'faceted-datatable',
        'iranalysis'
], function (ko, view, config, iraAPI) {
	function irBrowser(params) {
		var self = this;
		self.loading = ko.observable(false);
		self.config = config;
		self.analysisList = ko.observableArray();

        self.refresh = function() {
			self.loading(true);
			iraAPI.getAnalysisList().then(function(result) {
				self.analysisList(result);
				self.loading(false);
			});
		}

        self.onAnalysisSelected = function(d) {
            document.location = '#/iranalysis/' + d.id;
        }
        
        self.newAnalysis = function() {
            document.location = "#/iranalysis/new";
        }
        
        // startup actions
		self.refresh();
	}

	var component = {
		viewModel: irBrowser,
		template: view
	};

	ko.components.register('ir-browser', component);
	return component;
});