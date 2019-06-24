define(function (require, exports) {

	const REGISTER_PLUGIN_EVENT = 'registerAtlasPlugin';

	const registry = new Map();

	function add(type, { title, priority, html }) {
		let registeredPluginsOfGivenType = registry.get(type) || [];
		registeredPluginsOfGivenType.push({ title, priority: priority || 999, html });
		registry.set(type, registeredPluginsOfGivenType);
	}

	function findByType(type) {
		return [ ...registry.get(type) || [] ].sort((a, b) => (a.priority > b.priority) ? 1 : -1);
	}

	document.addEventListener(REGISTER_PLUGIN_EVENT, e => {
		add(e.detail.type, e.detail.plugin);
	});

	return {
		REGISTER_PLUGIN_EVENT,
		add,
		findByType,
	};
});