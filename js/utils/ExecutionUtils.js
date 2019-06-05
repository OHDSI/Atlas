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

	function generateVersionTags(generations) {
		let sortedHashes = _.orderBy([...generations], 'startTime', 'asc')
			.map(info => info.hashCode)
			.filter((element, index, array) => array.indexOf(element) === index);
		generations.forEach((info) => {
			info.tag = (info.hashCode) ? `V${sortedHashes.indexOf(info.hashCode) + 1}` : '-';
		});
		return generations;
	}

	return {
		StartExecution,
		generateVersionTags,
	};
});