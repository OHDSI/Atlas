define(
    (require, factory) => {

        const momentApi = require('webapi/MomentAPI');

        getLinkFormatter = ({ labelField = 'name' }) => (s, p, d) => {
            return '<a>' + d[labelField] + '</a>';
        };

        getDateFieldFormatter = (field = 'createdAt') => (s, p, d) => {
            return momentApi.formatDateTimeUTC(d[field]);
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
            getLinkFormatter,
        };
    }
);