define([
    'knockout',
    'text!./tags-badges-list.html',
    'components/Component',
    'utils/CommonUtils',
    'less!./tags-badges-list.less'
], function (
    ko,
    view,
    Component,
    commonUtils
) {
    class TagsBadgesList extends Component {
        constructor(params) {
            super(params);
            this.tags = params.tags;
            this.removable = params.removable || false;
            this.removeFunc = params.removeFunc || (() => {});
        }

        getTags() {
            return this.tags && ko.unwrap(this.tags)
                .filter(t => t.groups && t.groups.length > 0)
                .sort((t1, t2) => t1.groups[0].id - t2.groups[0].id)
                .map(t => {
                    return {
                        ...t,
                        groupLabel: t.groups.length === 1 ? ko.i18n('components.heading.tag.tooltip.group', 'Group:') :
                            ko.i18n('components.heading.tag.tooltip.groups', 'Groups:'),
                        groupList: t.groups.map(g => g.name).join(', '),
                        fullName: t.name,
                        ellipsisName: t.name.length > 22 ? t.name.substring(0, 20) + '...' : t.name,
                        tagColor: t.color || t.groups[0].color || '#cecece',
                        tagIcon: t.icon || t.groups[0].icon || 'fa fa-tag'
                    }
                });
        }
    }

    return commonUtils.build('tags-badges-list', TagsBadgesList, view);
});