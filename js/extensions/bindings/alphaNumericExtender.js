define(['knockout'], function (ko) {
    ko.extenders.alphaNumeric = function(target) {
        //create a writable computed observable to intercept writes to our observable
        var result = ko.pureComputed({
            read: target,  //always return the original observables value
            write: function(newValue) {
                const isAlphaNumeric = RegExp('^[a-zA-Z0-9.]+$');
                let current = target();
    
                //only write if it changed
                if (isAlphaNumeric.test(newValue) || newValue === "") {
					target(newValue);
                } else {
					target.notifySubscribers(current);
                }
            }
        }).extend({ notify: 'always' });
    
        //initialize with current value to make sure it is rounded appropriately
        result(target());
    
        //return the new computed observable
        return result;
    }
});