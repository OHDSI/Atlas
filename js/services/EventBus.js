define(function(require, exports) {

   const ko = require('knockout');

    class EventBus {

        constructor() {
            this.errorMsg = ko.observable();
        }

        clearMessage(){
            this.errorMsg(undefined);
        }
    }

    return new EventBus();
});
