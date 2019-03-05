define([
	'../const'
], (consts) => {

	async function StartExecution(executionGroup) {
		let confirmPromise;
		if (!executionGroup) {
			confirmPromise = new Promise((resolve, reject) => reject());
		} else {
			if (executionGroup.status() === consts.generationStatuses.STARTED) {
				confirmPromise = new Promise((resolve, reject) => {
					if (confirm('A generation for the source has already been started. Are you sure you want to start a new one in parallel?')) {
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

	return {
		StartExecution,
	};
});