define(
	(require, exports) => {
		const ko = require('knockout');
		const buildRoutes = require('./routes');

		return {
			title: ko.i18n('navigation.search', 'Search'),
			buildRoutes,
			navUrl: () => '#/search',
			icon: 'search',
			statusCss: () => ''
		};
	}
);