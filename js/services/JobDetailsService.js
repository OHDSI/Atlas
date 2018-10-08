define(['appConfig','job/jobDetail', 'atlas-state', 'services/http'], function (appConfig, jobDetail, sharedState, httpService) {

	function list() {
		return httpService.doGet(appConfig.api.url + 'notifications');
	}

	function createJob(updated) {
		let job = new jobDetail();
		job.type = updated.jobInstance.name;
		job.status(updated.status);
		job.name = updated.jobParameters.jobName;
		job.executionId = updated.executionId;
		sharedState.jobListing.queue(job);
	}
	
	return {
		createJob: createJob,
		list: list
	}
});
