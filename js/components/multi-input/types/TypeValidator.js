define([], function () 
{
	class TypeValidator {
        constructor(params) {
            this.type = params.type || null;
            this.extender = params.extender || null;
        }

        checkValue() {
            return true;
        }

        parseType(item) {
            return item;
        }
    }
	
	return TypeValidator;
});