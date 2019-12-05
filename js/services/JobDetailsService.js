define(['appConfig', 'services/job/jobDetail', 'atlas-state', 'services/http'], function (appConfig, jobDetail, sharedState, httpService) {

	function list() {
		return httpService.doGet(appConfig.api.url + 'notifications');
	}

	function createJob(updated) {
		let job = new jobDetail();
		job.type = updated.jobInstance.name;
		job.status(updated.status);
		job.name = updated.jobParameters.jobName;
		job.executionId = updated.executionId;
		job.url = getJobURL(updated)
		job.duration = '';
		job.endDate = '';
		queue(job);
	}

	function queue(newItem) {
		var oldItem = sharedState.jobListing().find(j => j.name === newItem.name);
		if (oldItem != null) {
			sharedState.jobListing.replace(oldItem, newItem);
		} else {
			sharedState.jobListing.unshift(newItem);
			if (sharedState.jobListing.length > 20) {
				sharedState.jobListing.pop()
			}
		}
	}

	function getJobURL(n) {
		switch (n.jobInstance.name) {
			case "generateCohort":
				return 'cohortdefinition/' + n.jobParameters.cohort_definition_id + '/generation';
			case 'irAnalysis':
				return 'iranalysis/' + n.jobParameters.analysis_id + '/generation';
			case 'negativeControlsAnalysisJob':
				return 'conceptset/' + n.jobParameters.concept_set_id + '/evidence';
			case 'generateCohortCharacterization':
				if (n.status == 'COMPLETED') {
				    return 'cc/characterizations/' + n.jobParameters.cohort_characterization_id + '/results/' +
				        n.executionId;
				} else {
				    return 'cc/characterizations/' + n.jobParameters.cohort_characterization_id + '/executions';
				}
			case 'generatePathwayAnalysis':
				if (n.status == 'COMPLETED') {
				    return 'pathways/' + n.jobParameters.pathway_analysis_id + '/results/' + n.executionId;
				} else {
				    return 'pathways/' + n.jobParameters.pathway_analysis_id + '/executions';
				}
			case "cohortAnalysisJob":
				return 'cohortdefinition/' + n.jobParameters.cohortDefinitionIds + '/reporting?sourceKey=' + n.jobParameters.sourceKey;
			case 'executionEngine':
				switch (n.jobParameters.scriptType) {
					case "CCA":
						return 'estimation/' + n.jobParameters.cohortId;
					case 'PLP':
						return 'plp/' + n.jobParameters.cohortId;
				}
      case 'warmCacheByUser':
        return 'configure';
		}
		return null;
	}

	function setLastViewedTime(lastViewedTime) {
		if (appConfig.userAuthenticationEnabled) {
			return httpService.doPost(appConfig.api.url + 'notifications/viewed', JSON.stringify(lastViewedTime))
		} else {
			localStorage.setItem('notifications-last-viewed-time', Date.now());
		}
	}

	function getLastViewedTime() {
		if (appConfig.userAuthenticationEnabled) {
			return httpService.doGet(appConfig.api.url + 'notifications/viewed')
		} else {
			return new Promise(function(resolve, reject) {
				let date = localStorage.getItem('notifications-last-viewed-time');
				resolve({data: date ? parseInt(date) : null})
			});
		}
	}


	return {
		createJob: createJob,
		list: list,
		getJobURL: getJobURL,
		setLastViewedTime: setLastViewedTime,
		getLastViewedTime: getLastViewedTime
	}
});
