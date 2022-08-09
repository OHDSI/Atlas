define([
    'knockout',
    'text!./multi-assign.html',
    'utils/AutoBind',
    'components/Component',
    'utils/CommonUtils',
    'utils/Renderers',
    'appConfig',
    'services/AuthAPI',
    'utils/DatatableUtils',
    'services/Tags',
    'components/entityBrowsers/concept-set-entity-browser',
    'components/entityBrowsers/cohort-definition-browser',
    'components/entityBrowsers/characterization-browser',
    'components/entityBrowsers/incidence-rate-browser',
    'components/entityBrowsers/cohort-pathway-browser',
    'components/entityBrowsers/reusable-browser',
    'less!./multi-assign.less',
], function (
    ko,
    view,
    AutoBind,
    Component,
    commonUtils,
    renderers,
    config,
    authApi,
    datatableUtils,
    TagsService
) {
    class TagsMultiAssign extends AutoBind(Component) {
        constructor(params) {
            super();
            this.params = params;

            this.isAuthenticated = authApi.isAuthenticated;
            this.actionType = ko.observable('assign');
            this.availableTags = ko.observableArray();
            this.selectedTags = ko.observableArray();
            this.showTagsModal = ko.observable(false);

            this.showAssetsTabsModal = ko.observable(false);
            this.selectedAssetTabKey = ko.observable('concept-sets');
            this.selectedAssets = ko.observableArray();

            TagsService.decorateComponent(this, {});
            this.getTags();
            this.tableOptions = commonUtils.getTableOptions('XS');
            this.availableTagsColumns = [
                {
                    title: ' ',
                    width: '20px',
                    sortable: false,
                    render: () => renderers.renderCheckbox('selected'),
                },
                {
                    title: ko.i18n('columns.group', 'Group'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="cell-tag-name" data-bind="title: '${d.groups[0].name}'">${d.groups[0].name}</span>`;
                    }
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="cell-tag-name" data-bind="title: '${d.name}'">${d.name}</span>`;
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
                }
            ];
            this.selectedTagsColumns = [
                {
                    title: ko.i18n('columns.group', 'Group'),
                    width: '100px',
                    render: (s, p, d) => {
                        return `<span class="cell-tag-name" data-bind="title: '${d.groups[0].name}'">${d.groups[0].name}</span>`;
                    }
                },
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
                    width: '80px',
                    sortable: false,
                    render: (s, p, d) => {
                            d.unselectTag = () => this.unselectTag(d);
                            return `<a data-bind="click: unselectTag" class="remove-link"><i class="fa fa-times"></i></a>`;
                    }
                }
            ];

            this.selectedAssetsColumns = [
                {
                    title: ko.i18n('columns.type', 'Type'),
                    data: 'type'
                },
                {
                    title: ko.i18n('columns.id', 'Id'),
                    className: 'id-column',
                    data: 'id'
                },
                {
                    title: ko.i18n('columns.name', 'Name'),
                    data: 'name',
                },
                {
                    title: ko.i18n('columns.created', 'Created'),
                    className: 'date-column',
                    render: datatableUtils.getDateFieldFormatter('createdDate'),
                },
                {
                    title: ko.i18n('columns.updated', 'Updated'),
                    className: 'date-column',
                    render: datatableUtils.getDateFieldFormatter('modifiedDate'),
                },
                {
                    title: ko.i18n('columns.author', 'Author'),
                    className: 'author-column',
                    render: datatableUtils.getCreatedByFormatter(),
                },
                {
                    title: '',
                    width: '80px',
                    sortable: false,
                    render: (s, p, d) => {
                        d.unselectAsset = () => {
                            this.unselectAsset(d);
                            if (d.selected) {
                                d.selected(false);
                            }
                        }
                        return `<a data-bind="click: unselectAsset" class="remove-link"><i class="fa fa-times"></i></a>`;
                    }
                }
            ];

            this.assetTabsParams = ko.observable({
                selectedTabKey: this.selectedAssetTabKey,
                selectTab: this.selectAssetTab,
                tabs: [
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.conceptsets', 'Concept Sets'),
                        key: 'concept-sets',
                        componentName: 'concept-set-entity-browser',
                        componentParams: {
                            buttonActionEnabled: false,
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: conceptSet => conceptSet.selected() ? this.conceptSetSelected(conceptSet) : this.unselectAsset(conceptSet)
                        }
                    },
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.cohorts', 'Cohorts'),
                        key: 'cohorts',
                        componentName: 'cohort-definition-browser',
                        componentParams: {
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: cohort => cohort.selected() ? this.cohortSelected(cohort) : this.unselectAsset(cohort)
                        }
                    },
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.characterizations', 'Characterizations'),
                        key: 'characterizations',
                        componentName: 'characterization-browser',
                        componentParams: {
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: characterization => characterization.selected() ? this.characterizationSelected(characterization) : this.unselectAsset(characterization)
                        }
                    },
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.incidenceRates', 'Incidence Rates'),
                        key: 'ir',
                        componentName: 'incidence-rate-browser',
                        componentParams: {
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: ir => ir.selected() ? this.incidenceRateSelected(ir) : this.unselectAsset(ir)
                        }
                    },
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.cohortPathways', 'Cohort Pathways'),
                        key: 'pathways',
                        componentName: 'cohort-pathway-browser',
                        componentParams: {
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: pathway => pathway.selected() ? this.pathwaySelected(pathway) : this.unselectAsset(pathway)
                        }
                    },
                    {
                        title: ko.i18n('tagging.multiAssign.tabs.reusables', 'Reusables'),
                        key: 'reusables',
                        componentName: 'reusable-browser',
                        componentParams: {
                            myDesignsOnly: true,
                            showCheckboxes: true,
                            renderLink: false,
                            onSelect: reusable => reusable.selected() ? this.reusableSelected(reusable) : this.unselectAsset(reusable)
                        }
                    },
                ]
            });

            this.actionResultSuccess = ko.observable(true);
            this.actionResultText = ko.observable();
        }

        hasEnoughSelectedData() {
            return this.selectedTags().length > 0 && this.selectedAssets().length > 0;
        }

        async getTags() {
            const res = await this.loadAvailableTags();
            this.availableTags(res.filter(t => t.groups && t.groups.length > 0).map(tag => ({ selected: ko.observable(false), ...tag })));
        }

        selectTag(tag) {
            if (this.selectedTags.indexOf(tag) < 0) {
                tag.selected(true);
                this.selectedTags.push(tag);
                this.availableTags.valueHasMutated();
            } else {
                this.unselectTag(tag);
            }
        }

        unselectTag(tag) {
            tag.selected(false);
            this.selectedTags.remove(t => t.id === tag.id);
            this.availableTags.valueHasMutated();
        }

        selectAssetTab(index, { key }) {
            this.selectedAssetTabKey(key);
        }

        conceptSetSelected(conceptSet) {
            this.checkAndAdd(this.selectedAssets, conceptSet, 'Concept Set');
        }

        cohortSelected(cohort) {
            this.checkAndAdd(this.selectedAssets, cohort, 'Cohort');
        }

        characterizationSelected(characterization) {
            this.checkAndAdd(this.selectedAssets, characterization, 'Characterization');
        }

        incidenceRateSelected(ir) {
            this.checkAndAdd(this.selectedAssets, ir, 'Incidence Rate');
        }

        pathwaySelected(pathway) {
            this.checkAndAdd(this.selectedAssets, pathway, 'Pathway');
        }

        reusableSelected(reusable) {
            this.checkAndAdd(this.selectedAssets, reusable, 'Reusable');
        }

        unselectAsset(asset) {
            this.selectedAssets.remove(cs => cs.id === asset.id && cs.type === asset.type);
        }

        async doAssign() {
            try {
                await TagsService.multiAssign(this.collectData());
                this.actionResultSuccess(true);
                this.actionResultText(ko.i18n('common.success', 'Success!')());
                this.assetTabsParams.valueHasMutated();
                this.clear();

                setTimeout(() => this.actionResultText(''), 3000);
            } catch {
                this.actionResultSuccess(false);
                this.actionResultText(ko.i18n('common.error', 'Error!')());
            }
        }

        async doUnassign() {
            try {
                await TagsService.multiUnassign(this.collectData());
                this.actionResultSuccess(true);
                this.actionResultText(ko.i18n('common.success', 'Success!')());
                this.assetTabsParams.valueHasMutated();
                this.clear();

                setTimeout(() => this.actionResultText(''), 3000);
            } catch {
                this.actionResultSuccess(false);
                this.actionResultText(ko.i18n('common.error', 'Error!')());
            }
        }

        collectData() {
            return {
                tags: this.selectedTags().map(t => t.id),
                assets: {
                    conceptSets: this.selectedAssets().filter(a => a.type === 'Concept Set').map(cs => cs.id),
                    cohorts: this.selectedAssets().filter(a => a.type === 'Cohort').map(c => c.id),
                    characterizations: this.selectedAssets().filter(a => a.type === 'Characterization').map(c => c.id),
                    incidenceRates: this.selectedAssets().filter(a => a.type === 'Incidence Rate').map(ir => ir.id),
                    pathways: this.selectedAssets().filter(a => a.type === 'Pathway').map(p => p.id),
                    reusables: this.selectedAssets().filter(a => a.type === 'Reusable').map(p => p.id),
                }
            };
        }

        checkAndAdd(arr, asset, type) {
            if (arr.indexOf(asset) < 0) {
                asset.type = type;
                arr.push(asset);
            }
        }

        clear() {
            this.selectedTags([]);
            this.selectedAssets([]);
            ko.utils.arrayForEach(this.availableTags(), (tag) => tag.selected(false));
            this.availableTags.valueHasMutated();
        }
    }

    return commonUtils.build('multi-assign', TagsMultiAssign, view);
});
