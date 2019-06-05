require([], () => {

	// Note:
	// due to lack of standard registered custom components list
	// https://github.com/w3c/webcomponents/issues/445

	if (!customElements.registry) {
		const registry = [];
		const immutableRegistryHandler = {
			get: function (target, property) {
				return target[property];
			},
			set: function (target, property, value, receiver) {
				// Restrict changes from outside to guarantee consistency
			}
		};
		customElements.registry = new Proxy(registry, immutableRegistryHandler);

		const origDefine = customElements.define;
		customElements.define = function () {
			origDefine.apply(this, arguments);
			registry.push(arguments);
		}
	}
});
