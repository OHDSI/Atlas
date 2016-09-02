define(['knockout', 'text!./r-manager.html','appConfig'], function (ko, view, config) {
	function rManager(params) {
		var self = this;
		self.model = params.model;
		self.nodes = ko.observableArray();
		self.rsbInfo = ko.observable();
		self.rserviPools = ko.observable();
		self.rsbJobs = ko.observableArray();
		self.selectedJob = ko.observable();
		self.selectedJobData = ko.observable();
		
		self.jobOptions = {
			Facets: [
				{
					'caption': 'Application',
					'binding': function (o) {
						return o.applicationName;
					}
				},
				{
					'caption': 'Success',
					'binding': function (o) {
						return o.success;
					}
				}
			]
		};
		
		self.options = {
			Facets: [
				{
					'caption': 'State',
					'binding': function (o) {
						return o.state;
					}
				}
			]
		};		

		self.columns = [
			{
				title: 'Id',
				data: 'id'
			},
			{
				title: 'State',
				data: 'state'
			},
			{
				title: 'Created',
				render: function (s, p, d) {
					var date = new Date(d.creation_time);
					return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
				}
			},
			{
				title: 'Lent Count',
				data: 'lent_count'
			}
		];
		
		self.jobColumns = [
			{
				title: 'Job Id',
				data: 'jobId'
			},
			{
				title: 'Application',
				data: 'applicationName'
			},
			{
				title: 'Success',
				data: 'success'
			},
			{
				title: 'Created',
				render: function (s, p, d) {
					var date = new Date(d.resultTime);
					return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
				}
			}
		];		

		self.showJobDetails = function(d) {
			$('#jobDetailModal').modal('show');
			self.selectedJob(d);
			
			$.ajax({
				url: config.rServicesHost + 'rsb/api/rest/result/TESTING/' + self.selectedJob().jobId + '.json',
				method: 'GET',
				success: function (response) {
					self.selectedJobData(response);
				}
			});			
		}
		
		self.loadNodes = function () {
			$.ajax({
				url: config.rServicesHost + 'rpooli/api/v1/nodes',
				method: 'GET',
				success: function (response) {
					self.nodes(response.nodes);
				}
			});
		}

		self.loadNodesConfig = function() {
			$.ajax({
				url: config.rServicesHost + 'rpooli/api/v1/config/r',
				method: 'GET',
				success: function (response) {
					console.log(response);
				}
			});
		}
		
		self.loadJobInfo = function() {
			var ticks = new Date().getTime();
			$.ajax({
				url: config.rServicesHost + 'rsb/api/rest/results/TESTING?_=' + ticks,
				method: 'GET',
				headers: {
					'Accept': 'application/vnd.rsb+json'
				},
				success: function (response) {
					self.rsbJobs(response.results.result);
				}
			});
		}
			
		self.loadSystemInfo = function () {
			$.ajax({
				url: config.rServicesHost + 'rsb/api/rest/system/info',
				method: 'GET',
				headers: {
					'Accept': 'application/vnd.rsb+json'
				},
				success: function (response) {
					self.rsbInfo(response.nodeInformation);
				}
			});
		}

		self.loadNodes();
		self.loadSystemInfo();
		self.loadJobInfo();
	}

	var component = {
		viewModel: rManager,
		template: view
	};

	ko.components.register('r-manager', component);
	return component;
});
