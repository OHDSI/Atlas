define([
    'knockout',
    'text!./tags-modal.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'utils/DatatableUtils',
    'services/AuthAPI',
    'less!./tags-modal.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    datatableUtils,
    authApi
) {
    class TagsModal extends AutoBind(Component) {
        constructor(params) {
            super(params);

            this.isModalShown = params.isModalShown;
            this.getTagsList = params.tagsList;
            this.allTagsList = ko.observableArray();
            this.assignedTagsList = ko.observableArray();
            this.tagGroupsList = ko.observableArray();
            this.currentTagGroup = ko.observable();
            this.tagsInGroupList = ko.observableArray();

            this.showCreateCustomTag = ko.observable(false);
            this.newCustomTagName = ko.observable();
            this.newCustomTagGroup = ko.observable();
            this.groupsForCustomTags = ko.observableArray();

            this.isLoading = ko.observable(true);

            this.assignTagFn = params.assignTagFn;
            this.unassignTagFn = params.unassignTagFn;
            this.createNewTagFn = params.createNewTagFn;
            this.loadAvailableTagsFn = params.loadAvailableTagsFn;
            this.checkAssignPermissionFn = params.checkAssignPermissionFn;
            this.checkUnassignPermissionFn = params.checkUnassignPermissionFn;

            this.tableOptions = commonUtils.getTableOptions('XS');

            this.tagGroupsColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="cell-tag-name" data-bind="title: name">${d.name}</span>`;
                    }
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    width: '465px',
                    render: (s, p, d) => {
                        return `<span class="cell-group-description" data-bind="title: '${d.description || '-'}'">${d.description || '-'}</span>`;
                    }
                },
                {
                    title: ko.i18n('columns.type', 'Type'),
                    width: '80px',
                    render: (s, p, d) => {
                        d.typeText = d.allowCustom
                            ? ko.i18n('components.tags.typeCustom', 'Free-form')
                            : ko.i18n('components.tags.typeSystem', 'System');
                        return `<span class="cell-tag-type" data-bind="text: typeText, title: typeText"></span>`;
                    }
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    sortable: false,
                    width: '80px',
                    render: (s, p, d) => {
                        d.showIncludedTagsTable = () => this.showIncludedTagsTable(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: showIncludedTagsTable, text: ko.i18n('components.tags.showTags', 'Show tags')" class="cell-tag-action"></a>`
                    }
                }
            ];

            this.tagsInGroupColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="cell-tag-name" data-bind="title: name">${d.name}</span>`;
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
                    width: '16px',
                    sortable: false,
                    render: (s, p, d) => {
                        if (d.assigned) {
                            return `<span class="fa fa-tag"></span>`;
                        }
                    }
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    width: '80px',
                    sortable: false,
                    render: (s, p, d) => {
                        if (d.permissionProtected && !this.checkAssignPermissionFn(d)) {
                            return `<span data-bind="text: ko.i18n('components.tags.notPermitted', 'Not permitted')" class="cell-tag-action"></span>`;
                        }
                        if (!d.assigned) {
                            d.assign = () => this.assignTag(d);
                            return `<a data-bind="css: '${this.classes('action-link')}', click: assign, text: ko.i18n('components.tags.assign', 'Assign')" class="cell-tag-action"></a>`
                        } else {
                            d.unassign = () => this.unassignTag(d);
                            return `<a data-bind="css: '${this.classes('action-link')}', click: unassign, text: ko.i18n('components.tags.unassign', 'Unassign')" class="cell-tag-action assigned"></a>`
                        }
                    }
                }
            ];

            this.isModalShown.subscribe(open => {
                if (!open) {
                    this.allTagsList([]);
                    this.tagsInGroupList([]);
                    return;
                }
                setTimeout(async () => {
                    try {
                        this.isLoading(true);
                        this.assignedTagsList(this.getTagsList());
                        await this.loadAvailableTags();
                        this.isLoading(false);
                    } catch (ex) {
                        console.log(ex);
                    }
                }, 0);
            });
        }

        async loadAvailableTags() {
            const res = await this.loadAvailableTagsFn();
            this.allTagsList(res.filter(t => t.groups && t.groups.length > 0));          // tags without main groups
            this.tagGroupsList(res.filter(t => !t.groups || t.groups.length === 0)       // main tag groups
                .sort((t1, t2) => t1.id - t2.id));
            this.groupsForCustomTags(this.tagGroupsList().filter(tg => tg.allowCustom));
        }

        async assignTag(tag) {
            try {
                let allowAssign = true;

                // non-multi-selection group check
                const nonMultiSelectedTagGroups = tag.groups.filter(tg => !tg.multiSelection);
                if (nonMultiSelectedTagGroups.length > 0) {
                    nonMultiSelectedTagGroups.forEach(ntg => {
                        this.assignedTagsList().filter(t => t.groups.filter(tg => tg.id === ntg.id).length > 0)
                            .forEach(t => {
                                if (t.permissionProtected && !this.checkUnassignPermissionFn(t)) {
                                    allowAssign = false;
                                    alert(ko.i18nformat('components.tags.cannotUnassignProtectedTagWarning', 'Cannot unassign protected tag: <%=tagName%>', {tagName: t.name})());
                                    return;
                                }
                                if (!confirm(ko.i18nformat('components.tags.reassignConfirm', 'The maximum number of assigned tags in the tag group "<%=tagGroup%>" is <%=maxNumber%>. The tag "<%=tagName%>" will be unassigned. Proceed?', {tagGroup: ntg.name, maxNumber: 1, tagName: t.name})())) {
                                    allowAssign = false;
                                    return;
                                }
                                this.unassignTag(t);
                            });
                    });
                }

                if (!allowAssign) {
                    return;
                }

                await this.assignTagFn(tag);
                tag.assigned = true;
                this.assignedTagsList.unshift(tag);
                if (tag.groups.filter(tg => tg.id === this.currentTagGroup().id).length > 0) {
                    this.tagsInGroupList.valueHasMutated();
                }
            } catch (ex) {
                console.log(ex);
            }
        }

        async unassignTag(tag) {
            try {
                await this.unassignTagFn(tag);
                this.assignedTagsList.remove(t => t.id === tag.id);
                ko.utils.arrayForEach(this.tagsInGroupList(), (t) => {
                    if (t.id === tag.id) {
                        t.assigned = false;
                    }
                });
                this.tagsInGroupList.valueHasMutated();
            } catch (ex) {
                console.log(ex);
            }
        }

        async createNewCustomTag() {
            const existingTag = this.exists(this.newCustomTagName());
            if(existingTag) {
                alert(ko.i18nformat('components.tags.tabs.tagNameExistsWarning', 'Tag <%=tagName%> already exists.', {tagName: this.newCustomTagName()})());
                return;
            }

            const tagGroup = this.groupsForCustomTags().filter(tg => tg.id === this.newCustomTagGroup())[0];
            const newTag = {
                name: this.newCustomTagName(),
                groups: [tagGroup]
            };
            try {
                const savedTagRes = await this.createNewTagFn(newTag);
                const savedTag = savedTagRes.data;
                await this.assignTag(savedTag);
                this.allTagsList().unshift(savedTag);
                if (this.newCustomTagGroup() === this.currentTagGroup().id) {
                    this.tagsInGroupList().unshift(savedTag);
                    this.sortByAssigned(this.tagsInGroupList);
                    this.tagsInGroupList.valueHasMutated();
                }
                this.newCustomTagName('');
            } catch (ex) {
                console.log(ex);
            }
        }

        exists(tagName) {
            return this.allTagsList().find(t => t.name === tagName);
        }

        showIncludedTagsTable(tagGroup) {
            const tags = this.allTagsList().filter(t => t.groups.filter(tg => tg.id === tagGroup.id).length > 0);
            tags.forEach(t => t.assigned = this.assignedTagsList().filter(at => at.id === t.id).length > 0);
            this.sortByAssigned(tags);
            this.tagsInGroupList(tags);
            this.currentTagGroup(tagGroup);
        }

        sortByAssigned(list) {
            list.sort((t1, t2) => t1.assigned === t2.assigned ? 0 : t1.assigned ? -1 : 1);
        }
    }

    return commonUtils.build('tags-modal', TagsModal, view);
});
