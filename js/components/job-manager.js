define(['knockout', 'text!./job-manager.html', 'knockout.dataTables.binding'], function (ko, view) {
	function jobManager(params) {
		var self = this;
		self.model = params.model;
		self.updateJobs = function () {
			self.model.jobs([]);

			$.ajax({
				url: self.model.services()[0].url + 'job/execution?comprehensivePage=true',
				method: 'GET',
				contentType: 'application/json',
				success: function (jobs) {
					for (var j = 0; j < jobs.content.length; j++) {
						var startDate = new Date(jobs.content[j].startDate);
						jobs.content[j].startDate = startDate.toLocaleDateString() + ' ' + startDate.toLocaleTimeString();

						var endDate = new Date(jobs.content[j].endDate);
						jobs.content[j].endDate = endDate.toLocaleDateString() + ' ' + endDate.toLocaleTimeString();

						if (jobs.content[j].jobParameters.jobName == undefined) {
							jobs.content[j].jobParameters.jobName = 'n/a';
						}
					}
					self.model.jobs(jobs.content);
				}
			});
		}

		self.updateJobs();
	}

	var component = {
		viewModel: jobManager,
		template: view
	};

	ko.components.register('job-manager', component);
	return component;
});
