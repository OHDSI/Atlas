define(['knockout', 'services/MomentAPI', 'xss', 'appConfig'],
    (ko, momentApi, filterXSS, appConfig) => {

        const getLinkFormatter = (builder) => (s, p, d) => {
            const {
                link,
                label,
                linkish = false,
            } = builder(d);

            if (p === 'display') {
                const name = filterXSS(label, appConfig.strictXSSOptions);
                return linkish
                    ? `<span class="linkish">${name}</span>`
                    : `<a ${link ? ('href="' + link + '"') : ''}>${name}</a>`;
            }
            return label;
        };

        const getDateFieldFormatter = (field = 'createdAt', defaultValue = false) => (s, type, d) => {
            if (type === "sort") {
              return (defaultValue && d[field]) || d[field] ? d[field] : defaultValue;
            } else {
							return (defaultValue && d[field]) || d[field] ? momentApi.formatDateTimeUTC(d[field]) : defaultValue;
						}
        };

        const getFacetForDate = function(date) {
            const daysSinceCreated = (new Date().getTime() - new Date(date).getTime()) / 1000 / 60 / 60 / 24;
            if (daysSinceCreated < .01) {
                return ko.i18n("facets.date.justNow", 'Just Now');
            } else if (daysSinceCreated < 1) {
                return ko.i18n('facets.date.within24Hours', 'Within 24 Hours');
            } else if (daysSinceCreated < 7) {
                return ko.i18n('facets.date.thisWeek', 'This Week');
            } else if (daysSinceCreated < 14) {
                return ko.i18n('facets.date.lastWeek', 'Last Week');
            } else {
                return ko.i18n("facets.date.others", '2+ Weeks Ago');
            }
        };

        const getCreatedByLogin = d =>
            d.hasOwnProperty('createdBy') && !!d.createdBy
                ? typeof d.createdBy === 'string'
                    ? d.createdBy
                    : typeof d.createdBy === 'object' && !!d.createdBy.login
                    ? d.createdBy.login
                    : 'anonymous'
                : 'anonymous';

        const getCreatedByFormatter = () => (s, p, d) => getCreatedByLogin(d);

        const getFacetForCreatedBy = getCreatedByLogin;

        const getFacetForDomain = (domain) => domain !== null ? domain : 'None';

        const renderCountColumn = (value) => value ? value : '...';

        const coalesceField = (list, field1, field2) => list.forEach(e => e[field1] = e[field1] || e[field2]);

        const COLUMNS = "executionStatus";

        const getExecutionStatus = () => (s, p, d) => {
					const status = ko.i18n(`${COLUMNS}.values.${s}`, s)();
					if (s === 'FAILED') {
						return `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${status}</a>`;
					} else if (s === 'STOPPED') {
						return ko.i18n(`${COLUMNS}.values.CANCELED`, 'CANCELED')();
					} else {
						return status;
					}
				};

        return {
            getDateFieldFormatter,
            getFacetForDate,
            getLinkFormatter,
            getCreatedByFormatter,
            getFacetForCreatedBy,
            renderCountColumn,
            getFacetForDomain,
            coalesceField,
            getExecutionStatus,
        };
    }
);