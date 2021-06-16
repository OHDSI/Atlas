define([
    'knockout',
    'text!./tags.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'utils/DatatableUtils',
    'services/AuthAPI',
    'less!./tags.less',
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
            this.tagsList = ko.observableArray();
            this.availableTagsList = ko.observableArray();
            this.availableTagGroupsList = ko.observableArray();

            this.showCreateCustomTag = ko.observable(false);
            this.newCustomTagName = ko.observable();
            this.newCustomTagGroup = ko.observable();
            this.groupsForCustomTags = ko.observableArray();

            this.referenceTagGroupsList = ko.observableArray();
            this.referenceTagsGroupName = ko.observable('');
            this.referenceTagsList = ko.observableArray();

            this.isLoading = ko.observable(false);

            this.assignTagFn = params.assignTagFn;
            this.unassignTagFn = params.unassignTagFn;
            this.createNewTagFn = params.createNewTagFn;
            this.loadAvailableTagsFn = params.loadAvailableTagsFn;
            this.checkAssignPermissionFn = params.checkAssignPermissionFn;
            this.checkUnassignPermissionFn = params.checkUnassignPermissionFn;

            this.tableOptions = commonUtils.getTableOptions('XS');

            this.selectedTab = ko.observable('tags-assignment');

            this.columns = [
                {
                    title: ko.i18n('columns.group', 'Group'),
                    render: (s, p, d) => {
                        return d.groups.map(g => g.name);
                    }
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name'
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    sortable: false,
                    render: (s, p, d) => {
                        if (d.permissionProtected && !this.checkUnassignPermissionFn(d)) {
                            return `<span data-bind="text: ko.i18n('components.tags.notPermitted', 'Not permitted')"></span>`;
                        }
                        d.unassign = () => this.unassignTag(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: unassign, text: ko.i18n('components.tags.unassign', 'Unassign')"></a>`
                    }
                }
            ];

            this.availableTagsColumns = [
                {
                    title: ko.i18n('columns.group', 'Group'),
                    render: (s, p, d) => {
                        return d.groups.map(g => g.name);
                    }
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name'
                },
                {
                    title: ko.i18n('columns.usageCount', 'Usage count'),
                    width: '80px',
                    data: 'count'
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    width: '80px',
                    sortable: false,
                    render: (s, p, d) => {
                        if (d.permissionProtected && !this.checkAssignPermissionFn(d)) {
                            return `<span data-bind="text: ko.i18n('components.tags.notPermitted', 'Not permitted')"></span>`;
                        }
                        d.assign = () => this.assignTag(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: assign, text: ko.i18n('components.tags.assign', 'Assign')"></a>`
                    }
                }
            ];

            this.referenceTagGroupsColumns = [
                {
                    title: ko.i18n('columns.group', 'Group'),
                    data: 'name',
                    width: '30%',
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    data: 'description',
                    width: '50%',
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    sortable: false,
                    width: '50%',
                    render: (s, p, d) => {
                        d.showIncludedTagsTable = () => this.showIncludedTagsTable(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: showIncludedTagsTable, text: ko.i18n('components.tags.showTags', 'Show tags')"></a>`
                    }
                },
            ];

            this.referenceTagsColumns = [
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name'
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    className: 'date-column',
                    render: datatableUtils.getDateFieldFormatter('createdDate'),
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    className: 'author-column',
                    render: datatableUtils.getCreatedByFormatter('System'),
                },
                {
                    title: ko.i18n('columns.description', 'Description'),
                    render: (s, p, d) => {
                        return d.description || '-';
                    }
                },
            ];

            this.isModalShown.subscribe(open => {
                if (!open) {
                    return;
                }
                this.isLoading(true);
                try {
                    this.referenceTagsGroupName('');
                    this.referenceTagsList([]);
                    this.tagsList(this.getTagsList());
                    this.loadAvailableTags();
                } catch (ex) {
                    console.log(ex);
                } finally {
                    this.isLoading(false);
                }
            });
        }

        async loadAvailableTags() {
            const res = await this.loadAvailableTagsFn();
            this.availableTagsList(res.filter(t => {
                if (t.groups && t.groups.length > 0) {
                    return this.tagsList().filter(t1 => t1.id === t.id).length === 0;
                }
                return false;
            }));
            this.availableTagGroupsList(res.filter(t => !t.groups || t.groups.length === 0));
            this.groupsForCustomTags(this.availableTagGroupsList().filter(tg => tg.allowCustom));
            this.referenceTagGroupsList(this.availableTagGroupsList().filter(tg => tg.description));
        }

        async assignTag(tag) {
            try {
                let allowAssign = true;

                // non-multi-selection group check
                const nonMultiSelectedTagGroups = tag.groups.filter(tg => !tg.multiSelection);
                if (nonMultiSelectedTagGroups.length > 0) {
                    nonMultiSelectedTagGroups.forEach(ntg => {
                        this.tagsList().filter(t => t.groups.filter(tg => tg.id === ntg.id).length > 0)
                            .forEach(t => {
                                if (t.permissionProtected && !this.checkUnassignPermissionFn(t)) {
                                    allowAssign = false;
                                    alert(ko.i18nformat('components.tags.cannotUnassignProtectedTagWarning', 'Cannot unassign protected tag: <%=tagName%>', {tagName: t.name}));
                                    return;
                                }
                                if (!confirm(ko.i18nformat('components.tags.reassignConfirm', 'The maximum number of assigned tags in the tag group "<%=tagGroup%>" is <%=maxNumber%>. The tag "<%=tagName%>" will be unassigned. Proceed?', {tagGroup: ntg.name, maxNumber: 1, tagName: t.name})())) {
                                    allowAssign = false;
                                    return;
                                }
                                this.unassignTag(t)
                            });
                    });
                }

                if (!allowAssign) {
                    return;
                }

                await this.assignTagFn(tag);
                this.tagsList.unshift(tag);
                this.availableTagsList.remove(t => t.id === tag.id);
            } catch (ex) {
                console.log(ex);
            }
        }

        async unassignTag(tag) {
            try {
                await this.unassignTagFn(tag);
                this.tagsList.remove(t => t.id === tag.id);
                this.availableTagsList.unshift(tag);
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
                this.newCustomTagName('');
            } catch (ex) {
                console.log(ex);
            }
        }

        selectTab(key) {
            this.selectedTab(key);
        }

        exists(tagName) {
            return this.availableTagsList().find(t => t.name === tagName) || this.tagsList().find(t => t.name === tagName);
        }

        showIncludedTagsTable(tagGroup) {
            const tags = this.availableTagsList().filter(t => t.groups.filter(tg => tg.id === tagGroup.id).length > 0)
                .concat(this.tagsList().filter(t => t.groups.filter(tg => tg.id === tagGroup.id).length > 0));
            this.referenceTagsList(tags);
            this.referenceTagsGroupName(tagGroup.name);
        }
    }

    return commonUtils.build('tags-modal', TagsModal, view);
});
