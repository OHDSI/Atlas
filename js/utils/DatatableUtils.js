define(['knockout', 'services/MomentAPI', 'xss', 'appConfig', 'services/AuthAPI', '../const'],
    (ko, momentApi, filterXSS, appConfig, authApi, consts) => {

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

        const getDateFieldFormatter = (field = 'createdDate', defaultValue = false, withSeconds = false) => (s, type, d) => {
            if (type === "sort") {
              return (defaultValue && d[field]) || d[field] ? d[field] : defaultValue;
            } else {
							return (defaultValue && d[field]) || d[field] ? momentApi.formatDateTimeUTC(d[field], withSeconds) : defaultValue;
						}
        };

        const getFacetForDate = function(date) {
            const daysSinceCreated = (new Date().getTime() - new Date(date).getTime()) / 1000 / 60 / 60 / 24;
            if (daysSinceCreated < .01) {
                return ko.i18n('facets.date.justNow', 'Just Now');
            } else if (daysSinceCreated < 1) {
                return ko.i18n('facets.date.within24Hours', 'Within 24 Hours');
            } else if (daysSinceCreated < 7) {
                return ko.i18n('facets.date.thisWeek', 'This Week');
            } else if (daysSinceCreated < 14) {
                return ko.i18n('facets.date.lastWeek', 'Last Week');
            } else {
                return ko.i18n('facets.date.others', '2+ Weeks Ago');
            }
        };

        const getCreatedByLogin = (d, emptyFieldSubstitute = 'anonymous') =>
            d.hasOwnProperty('createdBy') && !!d.createdBy
                ? typeof d.createdBy === 'string'
                    ? d.createdBy
                    : typeof d.createdBy === 'object' && !!d.createdBy.name
                    ? d.createdBy.name
                    : typeof d.createdBy === 'object' && !!d.createdBy.login
                    ? d.createdBy.login
                    : emptyFieldSubstitute
                : emptyFieldSubstitute;

        const getCreatedByFormatter = (emptyFieldSubstitute) => (s, p, d) => getCreatedByLogin(d, emptyFieldSubstitute);

        const getFacetForCreatedBy = getCreatedByLogin;

        const getFacetForDesign = d =>
            d.hasWriteAccess || (d.createdBy && authApi.subject() === d.createdBy.login)
                ? ko.i18n('facets.designs.myDesigns', 'My designs')
                : ko.i18n('facets.designs.otherDesigns', 'Other designs');

        const getFacetForDomain = (domain) => domain !== null ? domain : 'None';

        const renderCountColumn = (value) => value ? value : '...';

        const coalesceField = (list, field1, field2) => list.forEach(e => e[field1] = e[field1] || e[field2]);

        const idComparator = (a, b) => a.id - b.id;

        const extractTagGroups = (assetsList) => {
            const tagGroups = [];
            assetsList.forEach(e => {
                if (e.tags) {
                    const tagGroupsForElement = e.tags.filter(t => !t.groups || t.groups.length === 0);
                    tagGroupsForElement.forEach(tg => tagGroups.push(tg));
                }
            });
            return tagGroups
                .filter((tg, index, self) => self.findIndex(t => t.id === tg.id) === index)
                .sort(idComparator);
        };

        const addTagGroupsToFacets = (list, facets) => {
            extractTagGroups(list).sort().reverse().forEach(tg => {
                facets.unshift({
                    caption: tg.name,
                    binding: (o) => {
                        let tags = o.tags && o.tags.length > 0
                            ? o.tags
                                .filter(t => t.groups && t.groups.length > 0 && t.groups.filter(otg => otg.id === tg.id).length > 0)
                                .map(t => t.name)
                            : [];
                        return tags.length > 0 ? tags : ['Untagged'];
                    },
                    isArray: true
                });
            });
        };

        const addTagGroupsToColumns = (list, columns) => {
            extractTagGroups(list).forEach(tg => {
                columns.push({
                    title: tg.name,
                    width: '100px', // default width
                    visible: !!tg.showGroup,
                    render: (s, p, d) => {
                        const tags = d.tags && d.tags.length > 0
                            ? d.tags
                                .filter(t => t.groups && t.groups.length > 0 && t.groups.filter(otg => otg.id === tg.id).length > 0)
                                .map(t => t.name)
                            : [];
                        return tags.join(', ');
                    }
                });
            });
        };

        const renderExecutionStatus = () => (s, p, d) => {
            const { executionStatuses } = consts;
            const status = ko.i18n(`executionStatus.values.${s}`, s)();
            switch (s) {
                case executionStatuses.FAILED:
                    return `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${status}</a>`;
                default:
                    return `${status}`;
            }
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
            ? `<a data-bind="css: $component.classes('reports-link'), click: () => $component.goToResults(id), text: ko.i18n('components.analysisExecution.datatable.viewReports', 'View reports')"></a>`
            : '-';
        };

        const renderExexcutionResultsDownload = isPermittedFn => (s, p, d) => {
            const { executionStatuses } = consts;
            const { status } = d;
            return (status === executionStatuses.COMPLETED || status === executionStatuses.FAILED) && isPermittedFn(d.id) && d.numResultFiles > 0
                ? `<a href='#' data-bind="ifnot: $component.isDownloadInProgress(id), css: $component.classes('reports-link'), click: () => $component.downloadResults(id)"><i class="comparative-cohort-analysis-executions__action-ico fa fa-download"></i> ${ko.i18n('common.download', 'Download')()}</a><span data-bind="if: $component.isDownloadInProgress(id)"><i class="prediction-generation__action-ico fa fa-spinner fa-spin"></i> ${ko.i18n('common.downloading', 'Downloading...')()}</span>`
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
            html += currentHash() === hashCode ? ' ' + ko.i18n('components.analysisExecution.datatable.sameAsNow', '(same as now)')() : '';
            return html;
        };

        const getExecutionStatus = () => (s, p, d) => {
					const status = ko.i18n(`executionStatus.values.${s}`, s)();
					if (s === 'FAILED' && d) {
						return `<a href='#' data-bind="css: $component.classes('status-link'), click: () => $component.showExitMessage('${d.sourceKey}', ${d.id})">${status}</a>`;
					} else if (s === 'STOPPED') {
						return ko.i18n('executionStatus.values.CANCELED', 'CANCELED')();
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
            getFacetForDesign,
            renderCountColumn,
            getFacetForDomain,
            coalesceField,
            addTagGroupsToFacets,
            addTagGroupsToColumns,
            renderExecutionStatus,
            renderExecutionDuration,
            renderExecutionResultsView,
            renderExexcutionResultsDownload,
            renderExecutionDesign,
            getExecutionStatus,
        };
    }
);