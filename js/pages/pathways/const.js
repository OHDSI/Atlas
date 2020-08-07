define((require, exports) => {
	const pageTitle = 'Cohort Pathways';

	const pathwayGenerationStatus = {
		STARTED: 'STARTED',
		STARTING: 'STARTING',
		COMPLETED: 'COMPLETED',
	};

	const combinationWindowOptions = ['1', '3', '5', '7', '10', '14', '30'];
	const minCellCountOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
	const maxDepthOptions = ['1', '2', '3', '4', '5', '6', '7'];

	return {
		pageTitle,
		combinationWindowOptions,
		minCellCountOptions,
		maxDepthOptions
	};
});
