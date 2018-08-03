define(['knockout', 'lscache'], function (ko, lscache) {
    // Don't crash on browsers that are missing localStorage
    if (typeof (localStorage) === "undefined") { return; }

    ko.extenders.localStoragePersist = function(target, options) {

        var initialValue = target();

        var key = options[0];
        var expiration = options[1];

        // Load existing value from localStorage if set
        if (key && lscache.get(key) !== null) {
            try {
                initialValue = lscache.get(key);
            } catch (e) {
            }
        }
        target(initialValue);

        // Subscribe to new values and add them to localStorage
        target.subscribe(function (newValue) {
            lscache.set(key, newValue, expiration);
        });
        return target;
    };
});
