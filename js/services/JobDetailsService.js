define(['job/jobDetail', 'atlas-state', 'webapi/AuthAPI'], function (jobDetail, sharedState, authApi) {
	
	function createJob(details) {
		const job = new jobDetail(details);
		job.status(details.status);
		sharedState.jobListing.queue(job);
	}
	
	return {
		createJob: createJob
	}
});
