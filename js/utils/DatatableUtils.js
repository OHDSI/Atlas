define(
    (require, factory) => {

        const momentApi = require('utils/MomentUtils');

        const getLinkFormatter = (builder) => (s, p, d) => {
            const {
                link,
                label
            } = builder(d);
            return `<a ${link ? ('href="' + link + '"') : ''}>${label}</a>`;
        };

        const getDateFieldFormatter = (field = 'createdAt') => (s, p, d) => {
            return momentApi.formatDateTimeUTC(d[field]);
        };

        const getFacetForDate = function(date) {
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

        const getCreatedByLogin = (d) => d.hasOwnProperty('createdBy') && d.createdBy !== null ? d.createdBy.login : 'anonymous';

        const getCreatedByFormatter = () => (s, p, d) => getCreatedByLogin(d);

        const getFacetForCreatedBy = getCreatedByLogin;

        return {
            getDateFieldFormatter,
            getFacetForDate,
            getLinkFormatter,
            getCreatedByFormatter,
            getFacetForCreatedBy,
        };
    }
);