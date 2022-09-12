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
    TagsService
) {
    const DEFAULT_TAG_COLOR = '#cecece';
    const DEFAULT_TAG_ICON = 'fa fa-tag';

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
            this.showTagModal = ko.observable(false);
            this.currentTag = ko.observable();

            this.tagGroupColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    data: 'name'
                },
                {
                    title: ko.i18n('configuration.tagManagement.color', 'Color'),
                    width: '38px',
                    sortable: false,
                    render: (s, p, d) => {
                        return `<span class="center-span" data-bind="attr: { style: 'background-color: ${d.color || '#cecece'}'}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.icon', 'Icon'),
                    width: '30px',
                    sortable: false,
                    render: (s, p, d) => {
                        return `<span class="center-span"><i class="${d.icon || 'fa fa-tag'}"></i></span>`;
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.mandatory', 'Mandatory'),
                    width: '40px',
                    render: (s, p, d) => {
                        return d.mandatory ? `<span class="center-span" data-bind="attr: { title: ko.i18n('configuration.tagManagement.mandatoryCheckbox', 'Tag from the group is mandatory for an asset')}"><i class="fa fa-check"></i></span>` : '';
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.showInAssetsBrowser', 'Show&nbsp;Column'),
                    width: '40px',
                    render: (s, p, d) => {
                        return d.showGroup ? `<span class="center-span" data-bind="attr: { title: ko.i18n('configuration.tagManagement.showGroupCheckbox', 'Show Tag Group column in assets table')}"><i class='fa fa-check'></i></span>` : '';
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.allowMultiple', 'Multiple'),
                    width: '40px',
                    render: (s, p, d) => {
                        return d.multiSelection ? `<span class="center-span" data-bind="attr: { title: ko.i18n('configuration.tagManagement.multiSelectionCheckbox', 'Allow multiple tags from the group in a single asset')}"><i class='fa fa-check'></i></span>` : '';
                    }
                },
                {
                    title: ko.i18n('configuration.tagManagement.allowCustom', 'Free&#8209;form'),
                    width: '40px',
                    render: (s, p, d) => {
                        return d.allowCustom ? `<span class="center-span" data-bind="attr: { title: ko.i18n('configuration.tagManagement.allowCustomCheckbox', 'Allow custom tags creation in this group')}"><i class='fa fa-check'></i></span>` : '';
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
                        if (this.showTagsForGroup() && this.showTagsForGroup().id === d.id) {
                            d.resetCurrentGroup = () => this.showTagsForGroup(null);
                            return `<a data-bind="click: resetCurrentGroup, text: ko.i18n('configuration.tagManagement.hideTags', 'Hide tags')"></a>`;
                        } else {
                            d.setShowTagsForGroup = () => this.showTagsForGroup(d);
                            return `<a data-bind="click: setShowTagsForGroup, text: ko.i18n('configuration.tagManagement.showTags', 'Show tags')"></a>`;
                        }
                    }
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.editTagGroup = () => {
                            this.currentTagGroup({
                                ...d,
                                name: ko.observable(d.name),
                                color: ko.observable(d.color),
                                icon: ko.observable(d.icon),
                            });
                            this.showTagGroupModal(true);
                        };
                        return `<a data-bind="click: editTagGroup, text: ko.i18n('configuration.tagManagement.edit', 'Edit')"></a>`;
                    }
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.deleteTag = () => this.deleteTag(d);
                        return `<a data-bind="click: deleteTag, text: ko.i18n('configuration.tagManagement.remove', 'Remove')"></a>`;
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
                    width: '30px',
                    render: (s, p, d) => {
                        return d.permissionProtected ? `<span class="center-span"><i class='fa fa-check'></i></span>` : '';
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
                            this.currentTag({
                                ...d,
                                name: ko.observable(d.name),
                                color: ko.observable(d.color),
                                icon: ko.observable(d.icon),
                            });
                            this.showTagModal(true);
                        };
                        return `<a data-bind="click: editTag, text: ko.i18n('configuration.tagManagement.edit', 'Edit')"></a>`;
                    }
                },
                {
                    title: '',
                    width: '100px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.deleteTag = () => this.deleteTag(d);
                        return `<a data-bind="click: deleteTag, text: ko.i18n('configuration.tagManagement.remove', 'Remove')"></a>`;
                    }
                }
            ];
        }

        async onPageCreated() {
            const res = await TagsService.loadAvailableTags();
            this.allTags(res);
            this.tagGroups(res.filter(t => !t.groups || t.groups.length === 0));
        }

        createGroup() {
            this.currentTagGroup({
                groups: [],
                name: ko.observable(''),
                color: ko.observable(DEFAULT_TAG_COLOR),
                icon: ko.observable(DEFAULT_TAG_ICON),
            });
            this.showTagGroupModal(true);
        }

        createTag() {
            this.currentTag({
                name: ko.observable(''),
                color: ko.observable(),
                icon: ko.observable(),
                groups: [this.showTagsForGroup()],
                count: 0
            });
            this.showTagModal(true);
        }

        async saveTag(tagToSave) {

            try {
                let tag = ko.toJS(tagToSave);

                if (this.exists(tag.name, tag.id)) {
                    alert(ko.i18nformat('configuration.tagManagement.nameExistsWarning', 'Tag or Group name \'<%=tagName%>\' is already in use.', {tagName: tag.name})());
                    return;
                }

                if (tag.id !== undefined) {
                    let oldTag = ko.utils.arrayFirst(this.allTags(), t => t.id === tag.id);
                    let updatedTag = await TagsService.updateTag(tag);
                    this.allTags.replace(oldTag, updatedTag.data);
                } else {
                    let newTag = await TagsService.createNewTag(tag);
                    this.allTags.push(newTag.data);
                }

                if (tag.groups.length === 0) {
                    this.tagGroups(this.allTags().filter(t => !t.groups || t.groups.length === 0));

                    // replace tagGroup in tags
                    ko.utils.arrayFirst(this.allTags(), t => {
                        if (t.groups.length > 0 && t.groups[0].id === tag.id) {
                            t.groups[0] = tag;
                        }
                    });
                    // rerender tags table
                    if (this.showTagsForGroup() && this.showTagsForGroup().id === tag.id) {
                        this.showTagsForGroup(tag);
                    }

                    this.closeGroup();
                } else {
                    this.tags(this.allTags().filter(t => t.groups && t.groups.length > 0 && t.groups[0].id === tag.groups[0].id));
                    this.closeTag();
                }
            } catch(e) {
                console.log(e);
                alert("Error! Check the console.")
            }
        }

        async deleteTag(tag) {
            try {
                if (tag.groups.length === 0) {   // group

                    // check if group is empty
                    let empty = true;
                    ko.utils.arrayFirst(this.allTags(), t => {
                        if (t.groups.length > 0 && t.groups[0].id === tag.id) {
                            empty = false;
                        }
                    });

                    if (!empty) {
                        alert(ko.i18n('configuration.tagManagement.errorGroupNotEmpty', 'Cannot delete tag group: the group contains tags.')());
                        return;
                    }

                    if (!confirm(ko.i18n('configuration.tagManagement.deleteGroupConfirmation', 'Deletion cannot be undone! Are you sure?')())) {
                        return;
                    }
                } else {        // tag
                    if (!confirm(ko.i18n('configuration.tagManagement.deleteTagConfirmation', 'If the tag is assigned to an asset, it will be unassigned. Deletion cannot be undone. Are you sure you want to delete the tag?')())) {
                        return;
                    }
                }

                await TagsService.deleteTag(tag);
                this.allTags.remove(tag);

                if (tag.groups.length > 0) {   // tag
                    this.tags(this.allTags().filter(t => t.groups && t.groups.length > 0 && t.groups[0].id === tag.groups[0].id));
                } else {                       // group
                    this.tagGroups(this.allTags().filter(t => !t.groups || t.groups.length === 0));
                    this.showTagsForGroup(null);
                }

            } catch(e) {
                console.log(e);
                alert("Error! Check the console.")
            }
        }

        exists(tagName, skipId) {
            return this.allTags().find(t => t.id !== skipId && t.name.toLowerCase() === tagName.toLowerCase());
        }

        closeGroup() {
            this.showTagGroupModal(false);
            setTimeout(() => {
                this.currentTagGroup({});
            }, 0);
        }

        closeTag() {
            this.showTagModal(false);
            setTimeout(() => {
                this.currentTag({});
            }, 0);
        }
    }

    return commonUtils.build('tag-management', TagManagement, view);
});
