define(['knockout'], function (ko) {
    ko.extenders.numeric = function(target, precision) {
        //create a writable computed observable to intercept writes to our observable
        var result = ko.pureComputed({
            read: target,  //always return the original observables value
            write: function(newValue) {
                const isNumeric = RegExp('^-?[0-9]*(?:\.[0-9]+)?$');
                const isFloat = RegExp('^-?[0-9]*?\.[0-9]*$');
                const isFloatWithNoMantissa = RegExp('^-?[0-9]\\.$');
                const isFloatWithNoLeadingDigits = RegExp('^-?\.[0-9]*?$');
                const hasCharacters = RegExp('.*[a-zA-Z]+.*');
                if (newValue === null || newValue === "") {
                    target(null);
                } else {
                    var current = target(),
                        roundingMultiplier = Math.pow(10, precision);

                    var valueToWrite = newValue;
                    if (roundingMultiplier > 1) {
                        // When roundingMultiplier > 1, we're allowing floats
                        var newValueAsFloat;
                        if (isFloatWithNoMantissa.test(newValue)) {
                            // [0-9]. explicitly
                            newValueAsFloat = isFloatWithNoMantissa.exec(newValue)[0];
                        } else if (isFloatWithNoLeadingDigits.test(newValue)) {
                            // Lacking leading digits (e.g.): .0012
                            newValueAsFloat = newValue;
                        } else if (hasCharacters.test(newValue) || isNaN(parseFloat(newValue))) {
                            // Alpha characters
                            newValueAsFloat = current;
                        } else if (!isNaN(parseFloat(newValue)) && (parseFloat(newValue).toString().length !== newValue.length)) {
                            // Without this check numbers like
                            // 0.0000 will get reformatted as 0
                            newValueAsFloat = newValue;
                        } else {
                            newValueAsFloat = isFloat.test(newValue) ? parseFloat(isFloat.exec(newValue)[0]) : current;
                        }
                        valueToWrite = newValueAsFloat;
                    } else {
                        var newValueAsNum = isNumeric.test(newValue) ? +newValue : current,
                        valueToWrite = newValueAsNum !== null ? Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier : null;
                    }
        
                    //only write if it changed or if 
                    //the valueToWrite is "-" since 
                    //it may be the start of a negative number
                    if (newValue === "-") {
                        target(newValue);
                    } else if (valueToWrite !== current) {
                        target(valueToWrite);
                    } else {
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        }).extend({ notify: 'always' });
    
        //initialize with current value to make sure it is rounded appropriately
        result(target());
    
        //return the new computed observable
        return result;
    }
});