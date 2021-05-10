define([
    'knockout',
    'text!./tags.html',
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'less!./tags.less',
    'databindings',
], function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind
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

            this.isLoading = ko.observable(false);

            this.assignTagFn = params.assignTagFn;
            this.unassignTagFn = params.unassignTagFn;
            this.createNewTagFn = params.createNewTagFn;
            this.loadAvailableTagsFn = params.loadAvailableTagsFn;

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
                    title: ko.i18n('columns.tagName', 'Usage count'),
                    width: '40px',
                    data: 'count'
                },
                {
                    title: ko.i18n('columns.action', 'Action'),
                    sortable: false,
                    render: (s, p, d) => {
                        d.assign = () => this.assignTag(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: assign, text: ko.i18n('components.tags.assign', 'Assign')"></a>`
                    }
                }
            ];

            this.availableTagGroupsColumns = [
                {
                    title: ko.i18n('columns.group', 'Tag Group'),
                    render: (s, p, d) => {
                        return `<span class='bold'>${d.name}</span><br>Long description of the tag group`
                    }
                },
                {
                    title: ko.i18n('columns.tagName', 'Included Tags'),
                    render: (s, p, d) => {
                        const tags = this.availableTagsList().filter(t => t.groups.filter(tg => tg.id === d.id).length > 0)
                            .concat(this.tagsList().filter(t => t.groups.filter(tg => tg.id === d.id).length > 0));
                        return tags.map(t => `<span class="reference-tag">${t.name}</span>`).sort().join('<br>');
                    }
                },
            ];

            this.isModalShown.subscribe(open => {
                if (!open) {
                    return;
                }
                this.isLoading(true);
                try {
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
        }

        async assignTag(tag) {
            try {

                // non-multi-selection group check
                const nonMultiSelectedTagGroups = tag.groups.filter(tg => !tg.multiSelection);
                if (nonMultiSelectedTagGroups.length > 0) {
                    nonMultiSelectedTagGroups.forEach(ntg => {
                        this.tagsList().filter(t => t.groups.filter(tg => tg.id === ntg.id).length > 0)
                            .forEach(t => this.unassignTag(t));
                    });
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
                alert(`Tag ${this.newCustomTagName()} already exists.`);
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
    }

    return commonUtils.build('tags-modal', TagsModal, view);
});
