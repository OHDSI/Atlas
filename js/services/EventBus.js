define(function(require, exports) {

   const ko = require('knockout');

    class EventBus {

        constructor() {
            this.errorMsg = ko.observable();
        }

        setMessage(msg) {
            this.errorMsg(msg);
        }

        getMessage(){
            return this.errorMsg();
        }

        clearMessage(){
            this.errorMsg(undefined);
        }
    }

    return new EventBus();
});
