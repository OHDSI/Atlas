define([
    'knockout',
    'text!./tag-management.html',
    'pages/Page',
    'utils/AutoBind',
    'utils/CommonUtils',
    'utils/DatatableUtils',
    'appConfig',
    'services/AuthAPI',
    'services/Tags',
    'atlas-state',
    'databindings',
    'components/ac-access-denied',
    'components/heading',
    'less!./tag-management.less',
], function (
    ko,
    view,
    Page,
    AutoBind,
    commonUtils,
    datatableUtils,
    config,
    authApi,
    TagsService,
    sharedState
) {
    class TagManagement extends AutoBind(Page) {
        constructor(params) {
            super(params);
            this.loading = ko.observable();
            this.tableOptions = commonUtils.getTableOptions('S');
            this.isAuthenticated = authApi.isAuthenticated;

            this.hasAccess = ko.pureComputed(() => {
                if (!config.userAuthenticationEnabled) {
                    return true;
                } else {
                    return this.isAuthenticated() && authApi.isPermittedTagsManagement();
                }
            });

            this.allTags = ko.observableArray();
            this.tagGroups = ko.observableArray();
            this.showTagsForGroup = ko.observable();
            this.showTagsForGroup.subscribe((group) => {
                if (!group) {
                    this.tags([]);
                } else {
                    this.tags(this.allTags().filter(t => t.groups && t.groups.length > 0 && t.groups[0].id === group.id));
                }
            });
            this.showTagGroupModal = ko.observable(false);
            this.currentTagGroup = ko.observable();
            this.tags = ko.observableArray();

            this.tagGroupColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    data: 'name'
                },
                {
                    title: ko.i18n('configuration.tagManagement.color', 'Color'),
                    width: '60px',
                    render: (s, p, d) => {
                        return `<span data-bind="attr: { style: 'background-color: ${d.color || '#cecece'}'}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.icon', 'Icon'),
                    width: '60px',
                    render: (s, p, d) => {
                        return `<i class="${d.icon || 'fa fa-tag'}"></i>`;
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.mandatory', 'Mandatory'),
                    width: '60px',
                    render: (s, p, d) => {
                        return d.mandatory ? ko.i18n('common.yes', 'Yes')() : ko.i18n('common.no', 'No')();
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.showInAssetsBrowser', 'Show Column'),
                    width: '60px',
                    render: (s, p, d) => {
                        return d.showGroup ? ko.i18n('common.yes', 'Yes')() : ko.i18n('common.no', 'No')();
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.allowMultiple', 'Multiple'),
                    width: '60px',
                    render: (s, p, d) => {
                        return d.multiSelection ? ko.i18n('common.yes', 'Yes')() : ko.i18n('common.no', 'No')();
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.allowCustom', 'Custom'),
                    width: '60px',
                    render: (s, p, d) => {
                        return d.allowCustom ? ko.i18n('common.yes', 'Yes')() : ko.i18n('common.no', 'No')();
                    }
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    width: '120px',
                    render: (s, p, d) => {
                        const dateTime = datatableUtils.getDateFieldFormatter('createdDate')(s, p, d);
                        return `<span class="cell-tag-created" data-bind="title: '${dateTime}'">${dateTime}</span>`;
                    },
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    width: '100px',
                    render: (s, p, d) => {
                        const author = datatableUtils.getCreatedByFormatter('System')(s, p, d);
                        return `<span class="cell-tag-author" data-bind="title: '${author}'">${author}</span>`;
                    },
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    width: '225px',
                    render: (s, p, d) => {
                        const desc = d.description || '-';
                        return `<span class="cell-tag-description" data-bind="title: '${desc}'">${desc}</span>`;
                    }
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        if (this.showTagsForGroup() === d) {
                            d.resetCurrentGroup = () => this.showTagsForGroup(null);
                            return `<a data-bind="click: resetCurrentGroup, text: ko.i18n('columns.hideTags', 'Hide tags')"></a>`;
                        } else {
                            d.setShowTagsForGroup = () => this.showTagsForGroup(d);
                            return `<a data-bind="click: setShowTagsForGroup, text: ko.i18n('columns.showTags', 'Show tags')"></a>`;
                        }
                    }
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.editTagGroup = () => {
                            this.currentTagGroup(d);
                            this.showTagGroupModal(true);
                        }
                        return `<a data-bind="click: editTagGroup, text: ko.i18n('columns.edit', 'Edit')"></a>`;
                    }
                }
            ];

            this.tagColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="tag" data-bind="attr: { style: 'background-color: ${d.color || d.groups[0].color || '#cecece'}'}">
                                    <i class="${d.icon || d.groups[0].icon || 'fa fa-tag'}"></i>
                                    <span title="${d.name}">${d.name.length > 22 ? d.name.substring(0, 20) + '...' : d.name}</span>
                                </span>`;
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.protected', 'Protected'),
                    width: '60px',
                    render: (s, p, d) => {
                        return d.permissionProtected ? `${ko.i18n('common.yes', 'Yes')()}` : '';
                    }
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    width: '120px',
                    render: (s, p, d) => {
                        const dateTime = datatableUtils.getDateFieldFormatter('createdDate')(s, p, d);
                        return `<span class="cell-tag-created" data-bind="title: '${dateTime}'">${dateTime}</span>`;
                    },
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    width: '100px',
                    render: (s, p, d) => {
                        const author = datatableUtils.getCreatedByFormatter('System')(s, p, d);
                        return `<span class="cell-tag-author" data-bind="title: '${author}'">${author}</span>`;
                    },
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    width: '225px',
                    render: (s, p, d) => {
                        const desc = d.description || '-';
                        return `<span class="cell-tag-description" data-bind="title: '${desc}'">${desc}</span>`;
                    }
                },
                {
                    title: ko.i18n('columns.usageCount', 'Usage count'),
                    width: '90px',
                    data: 'count'
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.editTag = () => {
                            this.currentTag(d);
                            this.showTagModal(true);
                        }
                        return `<a data-bind="click: editTag, text: ko.i18n('columns.edit', 'Edit')"></a>`;
                    }
                }
            ];

            this.showTagModal = ko.observable(false);
            this.currentTag = ko.observable();
        }

        async onPageCreated() {
            const res = await TagsService.loadAvailableTags();
            this.allTags(res);
            this.tagGroups(res.filter(t => !t.groups || t.groups.length === 0));
        }
    }

    return commonUtils.build('tag-management', TagManagement, view);
});
