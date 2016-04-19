define(['knockout', 'text!./panacea-browser.html', 'appConfig', 'faceted-datatable'], function (ko, view, config) {
	function panaceaBrowser(params) {
		var self = this;
		self.model = params.model;
		self.services = params.services;
		self.currentService = ko.observable();
		self.reference = ko.observableArray();
        self.panaceaView = ko.observable();
		self.selectedPanaceaStudy = params.selectedPanaceaStudy;
		self.selected = params.panaceaStudyId;
		self.currentStudy = ko.observable();

		self.panaceaView.subscribe(function (d) {

			if(self.panaceaView() == 'review'){
				$.ajax({
					//url: self.services()[0].url + 'panacea/getAllStudy',
					url: config.services[0].url + 'panacea/getAllStudyWithLastRunTime',
					method: 'GET',
					success: function (d) {
						self.reference(d);
					}
				});
			}else if(self.panaceaView() == 'edit'){
/*				$.ajax({
					url: self.services()[0].url + 'panacea/' + self.selectedPanaceaStudy(),
					method: 'GET',
					success: function (d) {
						self.currentStudy(d);
					}
				});*/
			}
		});
		
//		self.selectedPanaceaStudy.subscribe(function (d) {
//
//			if(self.selectedPanaceaStudy != null){
//				self.panaceaView('edit');
//				$.ajax({
//					url: self.services()[0].url + 'panacea/' + self.selectedPanaceaStudy(),
//					method: 'GET',
//					success: function (d) {
//						self.currentStudy(d);
//					}
//				});
//			}else{
//				self.panaceaView('review');
//			}
//		});
		
		self.panaceaView('review');
		
		self.options = {
				"sDom": 'rtp',
				Facets: [
//							{
//								'caption': 'Start date',
//								'binding': function (o) {
//									var daysSinceModification = (new Date().getTime() - new Date(o.startDate).getTime()) / 1000 / 60 / 60 / 24;
//									if (daysSinceModification < 7) {
//										return 'This Week';
//									} else if (daysSinceModification < 14) {
//										return 'Last Week';
//									} else {
//										return '2+ Weeks Ago';
//									}
//								}
//							},
//							{
//								'caption': 'Name',
//								'binding': function (o) {
//									return o.studyName;
//								}
//							}
						]
		};

		self.renderStudyNameLink = function (s, p, d) {
			//return '<span class="linkish" data-bind="click: function(d) { rowClick(d); }">' + d.studyName + '</span>';
			return '<span class="linkish" >' + d.studyName + '</span>';
		}
		
		self.renderStudyId = function(s, p, d) {
			return d.studyId;
		}
		
		self.renderStudyCreateTime = function(s, p, d) {
			return new Date(d.createTime).toLocaleDateString() + " " + new Date(d.createTime).toLocaleTimeString();
		}
		
		self.renderLastRunTime = function(s, p, d) {
			if(d.lastRunTime != null){
				return new Date(d.lastRunTime).toLocaleDateString() + " " + new Date(d.lastRunTime).toLocaleTimeString();
			}else{
				return null;
			}
		}

		self.renderStudyResultsLink = function(s, p, d) {
			if(d.lastRunTime == null){
				return null;
			}else{
				return '<a href="#/panaceasunburstresult/' + d.studyId + '"><i class="fa fa-file"></i></a>';
			}
		}
		
		self.renderStudyCloneLink = function(s, p, d) {
			return '<a href="#/panaceaclone/'+ d.studyId  +'"><i class="fa fa-copy"></i></a>';
		}
		
		self.rowClick = function (d) {
			self.selectedPanaceaStudy = d;
			self.selected(d.studyId);
//            self.panaceaView('edit');
		}
		
		self.createStudy = function () {
			document.location = "#/panaceadef/undefined";
		};

		self.columns = [
			{
				title: 'Study Id',
				data: 'studyId'
			},
			{
				title: 'Name',
				render: self.renderStudyNameLink
			}
		];
	}

	var component = {
		viewModel: panaceaBrowser,
		template: view
	};

	ko.components.register('panacea-browser', component);
	return component;
});
