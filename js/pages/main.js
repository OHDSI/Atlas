define(
	(require, exports) => {
		const home = require('./home/index');
		const dataSources = require('./data-sources/index');
		const vocabulary = require('./vocabulary/index');
		const conceptSets = require('./concept-sets/index');
		const cohortDefinitions = require('./cohort-definitions/index');
		const characterizations = require('./characterizations/index');
		const incidenceRates = require('./incidence-rates/index');
		const profiles = require('./profiles/index');
		const pathways = require('./pathways/index');
		const estimation = require('./estimation/index');
		const prediction = require('./prediction/index');
		const reusables = require('./reusables/index');
		const tagging = require('./tagging/index');
		const jobs = require('./jobs/index');
		const configuration = require('./configuration/index');
		const feedback = require('./feedback/index');

		// order of nav items in left-nav will appear in the following order:
		return {
			home,
			dataSources,
			vocabulary,
			conceptSets,
			cohortDefinitions,
			characterizations,
			pathways,
			incidenceRates,
			profiles,
			estimation,
			prediction,
			reusables,
			tagging,
			jobs,
			configuration,
			feedback,
		};
	}
);