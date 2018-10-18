define(['services/job/jobDetail', 'atlas-state', 'services/AuthAPI'], function (jobDetail, sharedState, authApi) {
	
	function createJob(details) {
		const job = new jobDetail(details);
		job.status(details.status);
		sharedState.jobListing.queue(job);
	}
	
	return {
		createJob: createJob
	}
});
