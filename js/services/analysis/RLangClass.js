define(() => {
	class RLangClass {
		constructor(data = {}) {
			this.attr_class = data.attr_class || "args";
		}
	}
	
	return RLangClass;
});