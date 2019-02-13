define(['knockout'], function (ko) {
    ko.extenders.childChanges = (target, value) => {
		typeof target === 'function' && ko.isObservable(target()) && target().extend({ childChanges: true }).subscribe(() => target.valueHasMutated());
		return target;
	};
});