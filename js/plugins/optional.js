define("optional", function factory() {
	// We have to use a factory function with "return" so that semver-sync
	// picks up the version number when it checks or bumps.
	return {
		version: "0.1.1",

		// The array of failed loads.
		failed: [],

		load(name, req, onLoad, _config) {
			if (name.length !== 0) {
				try {
					req([name], onLoad, () => this.onModuleFailed(name, onLoad));
				} catch(er) {
					this.onModuleFailed(name, onLoad)
				}
			} else {
				onLoad(this);
			}
		},
		
		onModuleFailed(name, onLoad) {
			this.failed.push(name);
			// Undef exists only on the global require, not local ones.
			requirejs.undef(name);
	
			// We do not *define* the module but just return a default value for
			// it. This ensures isolation between calls that require the same
			// module, sometimes optionally, sometimes not.
			onLoad({});
		}
	};
});
