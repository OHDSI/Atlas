define(function(require, exports) {

   const ko = require('knockout');

    class EventBus {

        constructor() {
            this.errorMsg = ko.observable();
        }
    }

    return new EventBus();
});
