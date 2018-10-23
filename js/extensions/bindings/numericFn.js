define(['knockout'], function (ko) {
	ko.observable.fn.numeric = function () {
		var underlyingObservable = this;
		if (!this.numericInterceptor) {
			this.numericInterceptor = ko.computed({
				read: this,
				write: function (newValue) {
					
					if (newValue.trim)
						newValue = newValue.trim();
					
					var current = underlyingObservable(),
						valueToWrite = isNaN(newValue) ? current : parseFloat(newValue);

					if (newValue.length == 0)
						valueToWrite = null;

					//only write if it changed
					if (valueToWrite !== current) {
						underlyingObservable(valueToWrite);
					} else {
						//if the rounded value is the same, but a different value was written, force a notification for the current field
						if (newValue !== current) {
							underlyingObservable.notifySubscribers(valueToWrite);
						}
					}
				}
			}).extend({ notify: 'always' });
		}
		return this.numericInterceptor;
	};
});