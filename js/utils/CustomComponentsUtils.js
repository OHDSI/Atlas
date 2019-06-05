define(['extensions/customElementsRegistry'], () => {

	function defineOnce(name, definition) {
		if (!window.customElements.get(name)) {
			customElements.define(name, definition);
		}
	}

	function getCustomComponentsByType(type, dataKeys) {
		const components = [];
		for (let [index, value] of window.customElements.registry.entries()) {
			if (value[1].TYPE === type) {
				components.push({
					html: `<${value[0]} data-bind="{attr: { ${dataKeys.map(key => `'data-${key}': ${key}`).join(', ') } }}"></${value[0]}>`,
					title: value[1].TITLE,
					priority: value[1].PRIORITY || 999,
				});
			}
		}
		return components;
	}

	return {
		defineOnce,
		getCustomComponentsByType,
	};
});