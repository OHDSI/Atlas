define(
    (require, factory) => {

        const momentApi = require('webapi/MomentAPI');

        getDateFieldFormatter = () => (s, p, d) => {
            return momentApi.formatDateTimeUTC(d.createdAt);
        };

        getFacetForDate = function(date) {
            const daysSinceCreated = (new Date().getTime() - new Date(date).getTime()) / 1000 / 60 / 60 / 24;
            if (daysSinceCreated < .01) {
                return 'Just Now';
            } else if (daysSinceCreated < 1) {
                return 'Within 24 Hours';
            } else if (daysSinceCreated < 7) {
                return 'This Week';
            } else if (daysSinceCreated < 14) {
                return 'Last Week';
            } else {
                return '2+ Weeks Ago';
            }
        };

        return {
            getDateFieldFormatter,
            getFacetForDate,
        };
    }
);