define(['knockout', 'atlas-state', 'lodash'],
	function(ko, sharedState, {get}){

		ko.i18n = function(key, defaultValue, subtree) {
			return ko.pureComputed({
				read: () => {
					const translations = ko.unwrap(subtree || sharedState.localeSettings);
					const tr = translations && get(translations, key, defaultValue);
					return tr || key;
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