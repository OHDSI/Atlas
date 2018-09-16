define(
	(require, exports) => {
		const buildRoutes = require('./routes');

		return {
			title: 'Search',
			buildRoutes,
			navUrl: () => '#/search',
			icon: 'search',
			statusCss: () => ''
		};
	}
);