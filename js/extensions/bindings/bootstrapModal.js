define(['knockout'], function (ko) {
	ko.bindingHandlers.modal = {
		init: function (element, valueAccessor) {
			$(element).modal({
				show: false
			});

			var value = valueAccessor();
			if (ko.isObservable(value)) {
				 // Update 28/02/2018
				// Thank @HeyJude for fixing a bug on
				// double "hide.bs.modal" event firing.
				// Use "hidden.bs.modal" event to avoid
				// bootstrap running internal modal.hide() twice.
				$(element).on('hidden.bs.modal', function () {
					value(false);
				});
			}

			// Update 13/07/2016
			// based on @Richard's finding,
			// don't need to destroy modal explicitly in latest bootstrap.
			// modal('destroy') doesn't exist in latest bootstrap.
			// ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
			//    $(element).modal("destroy");
			// });

		},
		update: function (element, valueAccessor) {
			var value = valueAccessor();
			if (ko.utils.unwrapObservable(value)) {
				$(element).modal('show');
			} else {
				$(element).modal('hide');
			}
		}
	}
});