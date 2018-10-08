define(['job/jobDetail', 'atlas-state'], function (jobDetail, sharedState) {
	
	function createJob(updated) {
		let job = new jobDetail();
		job.type = updated.jobInstance.name;
		job.status(updated.status);
		job.name = updated.jobParameters.jobName;
		job.executionId = updated.executionId;
		sharedState.jobListing.queue(job);
	}
	
	return {
		createJob: createJob
	}
});
