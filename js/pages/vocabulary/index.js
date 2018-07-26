define(
	(require, exports) => {
		const buildRoutes = require('./routes');

		return {
			title: 'Search',
			buildRoutes,
			baseUrl: 'search',
			icon: 'search',
		};
	}
);