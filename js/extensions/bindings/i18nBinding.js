define(['knockout', 'atlas-state', 'lodash'],
	function(ko, sharedState, {get, template, mapValues}){
		ko.i18n = function(key, defaultValue, subtree) {
			return ko.pureComputed({
				read: () => {
					const translations = ko.unwrap(subtree || sharedState.localeSettings);
					const tr = (translations && get(translations, key, defaultValue)) || defaultValue;
					return tr || key;
				},
				write: (value) => value,
				owner: ko
			});
		};

		ko.i18nformat = function (key, arg1, arg2) {
			let defaultValue;
			let options;
			if (arg2 === undefined) {
				defaultValue = undefined;
				options =arg1;
			} else {
				defaultValue = arg1;
				options = arg2;
			}
			return ko.pureComputed(() => {
				const tmpl = ko.i18n(key, defaultValue);
				const unwrappedOptions = mapValues(options, ko.toJS);
				const compiledTemplate = template(ko.unwrap(tmpl), {sourceURL: 'i18n/templates[' + key + ']'});
				return compiledTemplate(unwrappedOptions);
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