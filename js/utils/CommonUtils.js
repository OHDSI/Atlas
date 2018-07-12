define(
	(require, factory) => {
		const ko = require('knockout');    
		
		const build = function(name, viewModelClass, template) {
			const component = {
				viewModel: viewModelClass,
				template,
			};
			viewModelClass.prototype.componentName = name;
		
			ko.components.register(name, component);
			return component;
		};

        const routeTo = function (path) {
            document.location = '#' + path;
        };

		return {
			build,
            routeTo,
		};
	}
);