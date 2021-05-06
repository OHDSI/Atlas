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
            this.tagName = ko.observable();
            this.newCustomTagName = ko.observable();
            this.isLoading = ko.observable(false);

            this.tagsSuggestions = ko.observableArray();
            this.tagsOptions = ko.computed(() => this.tagsSuggestions().map(t => t.name));
            this.tagsSearch = ko.observable();
            this.tagsSearch.subscribe(() => this.loadTagsSuggestions());

            this.assignTagFn = params.assignTagFn;
            this.unassignTagFn = params.unassignTagFn;
            this.suggestFn = params.suggestFn;
            this.loadAvailableTagsFn = params.loadAvailableTagsFn;

            this.tableOptions = commonUtils.getTableOptions('XS');

            this.columns = [
                {
                    class: this.classes('tags-tbl-col-name'),
                    title: ko.i18n('columns.tagGroup', 'Tag Groups'),
                    render: (s, p, d) => {
                        return d.groups.map(g => g.name);
                    }
                },
                {
                    class: this.classes('tags-tbl-col-name'),
                    title: ko.i18n('columns.tagName', 'Tag Name'),
                    data: 'name'
                },
                {
                    class: this.classes('tags-tbl-col-action'),
                    title: ko.i18n('columns.action', 'Action'),
                    render: (s, p, d) => {
                        d.unassign = () => this.unassignTag(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: unassign, text: ko.i18n('components.tags.unassign', 'Unassign')"></a>`
                    }
                }
            ];

            this.availableTagsColumns = [
                {
                    class: this.classes('tags-tbl-col-name'),
                    title: ko.i18n('columns.tagGroup', 'Tag Groups'),
                    render: (s, p, d) => {
                        return d.groups.map(g => g.name);
                    }
                },
                {
                    class: this.classes('tags-tbl-col-name'),
                    title: ko.i18n('columns.tagName', 'Tag Name'),
                    data: 'name'
                },
                {
                    class: this.classes('tags-tbl-col-name'),
                    title: ko.i18n('columns.tagName', 'Usage count'),
                    data: 'count'
                },
                {
                    class: this.classes('tags-tbl-col-action'),
                    title: ko.i18n('columns.action', 'Action'),
                    render: (s, p, d) => {
                        d.assign = () => this.assignTag(d);
                        return `<a data-bind="css: '${this.classes('action-link')}', click: assign, text: ko.i18n('components.tags.assign', 'Assign')"></a>`
                    }
                }
            ];

            this.isModalShown.subscribe(open => {
                if (!open) {
                    return;
                }
                this.tagsList(this.getTagsList());
                this.loadAvailableTags();
            });
        }

        async loadTagsSuggestions() {
            if (!this.tagsSearch()) {
                this.tagsSuggestions([]);
                return;
            }

            const res = await this.suggestFn(this.tagsSearch());
            this.tagsSuggestions(res);
        }

        async loadAvailableTags() {
            const res = await this.loadAvailableTagsFn();
            this.availableTagsList(res.filter(t => {
                if (t.groups && t.groups.length > 0) {
                    return this.tagsList().filter(t1 => t1.id === t.id).length === 0;
                }
                return false;
            }));
        }

        assignSuggestedTag() {
            this.assignTag(this.tagsSuggestions().find(t => t.name === this.tagName()));
        }

        async assignTag(tag) {
            try {
                await this.assignTagFn(tag);
                tag.count = tag.count + 1;
                this.tagsList.unshift(tag);
                this.availableTagsList.remove(t => t.id === tag.id);
                this.tagName('');
                this.tagsSuggestions([]);
            } catch (ex) {
                console.log(ex);
            }
        }

        async unassignTag(tag) {
            try {
                await this.unassignTagFn(tag);
                tag.count = tag.count - 1;
                this.tagsList.remove(t => t.id === tag.id);
                this.availableTagsList.unshift(tag);
            } catch (ex) {
                console.log(ex);
            }
        }

        async createNewCustomTag() {

        }
    }

    return commonUtils.build('tags-modal', TagsModal, view);
});
