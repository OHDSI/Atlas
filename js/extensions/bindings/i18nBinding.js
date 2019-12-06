define(['knockout', 'atlas-state', 'lodash'],
	function(ko, sharedState, {get}){

		ko.i18n = function(key, defaultValue) {
			return ko.pureComputed({
				read: () => {
					const tr = sharedState.localeSettings() && get(sharedState.localeSettings(), key, defaultValue);
					return tr ? tr : key;
				},
				write: (value) => value,
			});
		};

		ko.bindingHandlers.i18n = {
			init: function(element, valueAccessor) {
				const translated = ko.pureComputed(function(){
					const value = ko.unwrap(valueAccessor());
					const tr = sharedState.localeSettings() && get(sharedState.localeSettings(), value);
					return tr ? tr : value;
				});

				return ko.applyBindingsToNode(element, { attr: translated });
			}
		};
	}
);