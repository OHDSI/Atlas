define([
	'knockout',
	'../const'
], (ko, consts) => {

	async function StartExecution(executionGroup) {
		let confirmPromise;
		if (!executionGroup) {
			confirmPromise = new Promise((resolve, reject) => reject());
		} else {
			if ([consts.generationStatuses.STARTED, consts.generationStatuses.RUNNING].includes(executionGroup.status())) {
				confirmPromise = new Promise((resolve, reject) => {
					if (confirm(ko.i18n('components.executionUtils.startNewExecutionInParallelConfirmation', 'A generation for the source has already been started. Are you sure you want to start a new one in parallel?')())) {
						resolve();
					} else {
						reject();
					}
				})
			} else {
				confirmPromise = new Promise(res => res());
			}
		}
		return confirmPromise;
	}

	function generateVersionTags(generations) {
		let sortedHashes = _.orderBy([...generations], 'startTime', 'asc')
			.map(info => info.hashCode)
			.filter((element, index, array) => array.indexOf(element) === index);
		generations.forEach((info) => {
			info.tag = (info.hashCode) ? `V${sortedHashes.indexOf(info.hashCode) + 1}` : '-';
		});
		return generations;
	}

	function getExecutionGroupStatus(submissions = []) {
		const { executionStatuses } = consts;
		const submissionStatuses = submissions().map(s => s.status);
		if (submissionStatuses.includes(executionStatuses.PENDING)) {
			return executionStatuses.PENDING;
		} else if (submissionStatuses.includes(executionStatuses.STARTED)) {
			return executionStatuses.STARTED;
		} else if (submissionStatuses.includes(executionStatuses.RUNNING)) {
			return executionStatuses.RUNNING;
		}
		return executionStatuses.COMPLETED;
	}

	return {
		StartExecution,
		generateVersionTags,
		getExecutionGroupStatus,
	};
});