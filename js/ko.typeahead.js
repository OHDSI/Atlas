define(['jquery', 'knockout', 'bloodhound', 'typeahead'], function ($, ko, bloodhound) {
	ko.bindingHandlers.typeahead = {
		update: function (element, valueAccessor, allBindings) {
			// http://stackoverflow.com/a/19366003/1247130 get value to update properly when typeahead choice is selected.

			var templateName = ko.unwrap(allBindings().templateName);
			var mapping = ko.unwrap(allBindings().mappingFunction);
			var displayedProperty = ko.unwrap(allBindings().displayKey);
			var value = allBindings.get("value");

			var val = ko.unwrap(valueAccessor());
			var remoteFilter = ko.unwrap(allBindings.get("remoteFilter"));
			var wildcard = ko.unwrap(allBindings.get("wildcard")) || '%QUERY';
			var auth = (allBindings.has("authToken")) ? {
				"Authorization": "Bearer " + ko.unwrap(allBindings().authToken)
			} : {};
			var resultsLimit = allBindings.get("limit") || 10;
			var datumTokenizer = ko.unwrap(allBindings.get("datumTokenizer")) || bloodhound.tokenizers.whitespace;

			var localData = null;
			var url = null;
			var isLocal;
			if (Array.isArray(val)) {
				localData = val;
				isLocal = true;
			} else {
				url = val;
				isLocal = false;
			}

			// If the URL is specified, set up the remote filter for suggestions
			var suggestions = null;
			if (isLocal) {
				suggestions = new bloodhound({
					datumTokenizer: datumTokenizer,
					queryTokenizer: bloodhound.tokenizers.whitespace,
					local: localData
				});
			} else {
				var remoteData = {
					url: url,
					wildcard: wildcard,
					ajax: {
						headers: auth
					}
				};
				if (remoteFilter) {
					remoteData.filter = remoteFilter;
				};
				suggestions = new bloodhound({
					datumTokenizer: datumTokenizer,
					queryTokenizer: bloodhound.tokenizers.whitespace,
					remote: remoteData
				});
			}

			suggestions.initialize();

			$(element).typeahead("destroy");

			var typeaheadOpts = {
				source: suggestions.ttAdapter(),
				displayKey: displayedProperty || function (item) {
					return item;
				},
				limit: resultsLimit
			};

			if (templateName) {
				typeaheadOpts.templates = {
					suggestion: function (item) {
						var temp = document.createElement("div");
						var model = mapping ? mapping(item) : item;
						ko.renderTemplate(templateName, model, null, temp, "replaceChildren");

						return temp;
					}
				};
			}

			$(element)
				.typeahead({
					hint: true,
					highlight: true
				}, typeaheadOpts)
				.on("typeahead:selected typeahead:autocompleted", function (e, suggestion) {
					if (value && ko.isObservable(value)) {
						value(suggestion);
					}
				});
		}
	};
});
