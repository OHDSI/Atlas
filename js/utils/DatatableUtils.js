define(['services/MomentAPI', 'xss', 'appConfig', 'services/AuthAPI', '../const'],
    (momentApi, filterXSS, appConfig, authApi, consts) => {

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

        const getDateFieldFormatter = (field = 'createdDate', defaultValue = false) => (s, type, d) => {
            if (type === "sort") {
              return (defaultValue && d[field]) || d[field] ? d[field] : defaultValue;
            } else {
							return (defaultValue && d[field]) || d[field] ? momentApi.formatDateTimeUTC(d[field]) : defaultValue;
						}
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

        const getFacetForDesign = d =>
            d.hasWriteAccess || (d.createdBy && authApi.subject() === d.createdBy.login)
                ? "My designs"
                : "Other designs";

        const getFacetForDomain = (domain) => domain !== null ? domain : 'None';

        const renderCountColumn = (value) => value ? value : '...';

        const coalesceField = (list, field1, field2) => list.forEach(e => e[field1] = e[field1] || e[field2]);

        const renderExecutionStatus = () => (s, p, d) => {
            const { executionStatuses } = consts;
            switch (s) {
                case executionStatuses.FAILED:
                    return `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${s}</a>`;
                case executionStatuses.CANCELED:
                    return 'CANCELED';
                case executionStatuses.PENDING:
                    return 'PENDING';
                default:
                    return s;
            };
        };

        const renderExecutionDuration = () => (s, p, d) => {
            const { startTime } = d;
            const endTime = d.endTime || Date.now();
            return startTime ? momentApi.formatDuration(endTime - startTime) : '';
        };

        const renderExecutionResultsView = () => (s, p, d) => {
            const { executionStatuses } = consts;
            const { status } = d;
            return status === executionStatuses.COMPLETED
            ? `<a data-bind="css: $component.classes('reports-link'), click: () => $component.goToResults(id)">View reports</a>`
            : '-';
        };

        const renderExexcutionResultsDownload = isPermittedFn => (s, p, d) => {
            const { executionStatuses } = consts;
            const { status } = d;
            return (status === executionStatuses.COMPLETED || status === executionStatuses.FAILED) && isPermittedFn(d.id) && d.numResultFiles > 0
                ? `<a href='#' data-bind="ifnot: $component.isDownloadInProgress(id), css: $component.classes('reports-link'), click: () => $component.downloadResults(id)"><i class="comparative-cohort-analysis-executions__action-ico fa fa-download"></i> Download</a><span data-bind="if: $component.isDownloadInProgress(id)"><i class="prediction-generation__action-ico fa fa-spinner fa-spin"></i> Downloading...</span>`
                : '-';
        }

        const renderExecutionDesign = (isPermittedFn, currentHash) => (s, p, d) => {
            const { id, tag = '-', hashCode } = d;
            let html = '';
            if (isPermittedFn(id) && hashCode) {
              html = `<a data-bind="css: $component.classes('design-link'), click: () => $component.showExecutionDesign(${id})">${(tag)}</a>`;
            } else {
              html = tag;
            }
            html += currentHash() === hashCode ? ' (same as now)' : '';
            return html;
        };

        return {
            getDateFieldFormatter,
            getFacetForDate,
            getLinkFormatter,
            getCreatedByFormatter,
            getFacetForCreatedBy,
            getFacetForDesign,
            renderCountColumn,
            getFacetForDomain,
            coalesceField,
            renderExecutionStatus,
            renderExecutionDuration,
            renderExecutionResultsView,
            renderExexcutionResultsDownload,
            renderExecutionDesign,
        };
    }
);