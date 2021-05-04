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
                        return `<a data-bind="css: '${this.classes('unassign-link')}', click: unassign, text: ko.i18n('components.tags.unassign', 'Unassign')"></a>`
                    }
                }
            ];

            this.isModalShown.subscribe(open => !!open && this.tagsList(this.getTagsList()));
        }

        async loadTagsSuggestions() {
            if (!this.tagsSearch()) {
                this.tagsSuggestions([]);
                return;
            }

            const res = await this.suggestFn(this.tagsSearch());
            this.tagsSuggestions(res);
        }

        async assignTag() {
            this.isLoading(true);
            try {
                const tag = this.tagsSuggestions().find(t => t.name === this.tagName());
                await this.assignTagFn(tag);
                const tags = this.tagsList();
                tags.push(tag);
                this.tagsList(tags);
                this.tagName('');
                this.tagsSuggestions([]);
            } catch (ex) {
                console.log(ex);
            }
            this.isLoading(false);
        }

        async unassignTag(tag) {
            this.isLoading(true);
            try {
                await this.unassignTagFn(tag);
                this.tagsList(this.tagsList().filter(t => t.id !== tag.id));
            } catch (ex) {
                console.log(ex);
            }
            this.isLoading(false);
        }

        async createNewCustomTag() {

        }
    }

    return commonUtils.build('tags-modal', TagsModal, view);
});
