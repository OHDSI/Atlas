define([
	'job/jobDetail',
	'atlas-state',
], function (
	jobDetail,
	sharedState,
) {
	
	function createJob(details) {
		const job = new jobDetail(details);
		job.status(details.status);
		sharedState.jobListing.queue(job);
	}
	
	return {
		createJob: createJob
	}
});
