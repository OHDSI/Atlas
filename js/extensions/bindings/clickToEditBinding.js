define(['knockout'], function (ko) {

	ko.bindingHandlers.hidden = {
		update: function (element, valueAccessor) {
			ko.bindingHandlers.visible.update(element, function () {
				return !ko.utils.unwrapObservable(valueAccessor());
			});
		}
	};

	ko.bindingHandlers.clickToEdit = {
		init: function (element, valueAccessor) {
			const observable = ko.isObservable(valueAccessor()) ? valueAccessor() : ko.observable(valueAccessor());
			const span = document.createElement("span"),
				input = document.createElement("input");

			element.appendChild(span);
			element.appendChild(input);

			observable.editing = ko.observable(false);

			ko.applyBindingsToNode(span, {
				text: ko.computed(function() { return (observable() || "").length > 0 ? observable() : "Click to Edit";}),
				hidden: observable.editing,
				click: observable.editing.bind(null, true)
			});

			ko.applyBindingsToNode(input, {
				value: observable,
				visible: observable.editing,
				hasfocus: observable.editing,
				event: {
					keyup: function (data, event) {
						//if user hits enter, set editing to false, which makes field lose focus
						if (event.keyCode === 13) {
							observable.editing(false);
							return false;
						}
						//if user hits escape, push the current observable value back to the field, then set editing to false
						else if (event.keyCode === 27) {
							observable.valueHasMutated();
							observable.editing(false);
							return false;
						}
					}
				}
			});
		}
	};
});