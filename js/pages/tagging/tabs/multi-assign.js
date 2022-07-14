define([
    'knockout',
    'text!./multi-assign.html',
    'utils/AutoBind',
    'components/Component',
    'utils/CommonUtils',
    'appConfig',
    'services/AuthAPI',
    'utils/DatatableUtils',
    'services/Tags',
    'pages/characterizations/components/characterizations/characterizations-list',
    'less!./multi-assign.less',
], function (
    ko,
    view,
    AutoBind,
    Component,
    commonUtils,
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
            this.hasPageAccess = ko.pureComputed(() => {
                return (config.userAuthenticationEnabled && this.isAuthenticated() &&
                    (authApi.isPermittedTagsGroupAssign() || authApi.isPermittedTagsGroupUnassign())) ||
                    !config.userAuthenticationEnabled;
            });
            this.actionType = ko.observable('assign');
            this.availableTags = ko.observableArray();
            this.tags = ko.observableArray();

            this.selectedAssetTabKey = ko.observable('concept-sets');
            this.selectedConceptSets = ko.observableArray();
            this.selectedCohorts = ko.observableArray();
            this.selectedCharacterizations = ko.observableArray();
            this.selectedIncidenceRates = ko.observableArray();
            this.selectedPathways = ko.observableArray();

            TagsService.decorateComponent(this, {});
            this.getTags();
            this.tableOptions = commonUtils.getTableOptions('XS');
            this.tagsColumns = [
                {
                    title: ko.i18n('columns.action', 'Action'),
                    width: '80px',
                    sortable: false,
                    render: (s, p, d) => {
                        if (this.tags.indexOf(d) < 0) {
                            d.selectTag = () => this.selectTag(d);
                            return `<a data-bind="css: '${this.classes('action-link')}', click: selectTag, text: ko.i18n('common.select', 'Select')"></a>`
                        }
                    }
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

            this.assetTabsParams = ko.observable({
                selectedTabKey: this.selectedAssetTabKey,
                selectTab: this.selectAssetTab,
                tabs: [
                    {
                        title: ko.i18n('tagging.tabs.multiAssign', 'Concept Sets'),
                        key: 'concept-sets',
                        componentName: 'concept-set-browser',
                        componentParams: {
                            buttonActionEnabled: false,
                            onRespositoryConceptSetSelected: conceptSet => this.conceptSetSelected(conceptSet)
                        }
                    },
                    {
                        title: ko.i18n('tagging.tabs.multiAssign', 'Cohorts'),
                        key: 'cohorts',
                        componentName: 'cohort-definition-browser',
                        componentParams: {
                            onSelect: cohort => this.cohortSelected(cohort)
                        }
                    },
                    {
                        title: ko.i18n('tagging.tabs.multiAssign', 'Characterizations'),
                        key: 'characterizations',
                        componentName: 'characterizations-list'
                    },
                    {
                        title: ko.i18n('tagging.tabs.multiAssign', 'Incidence Rates'),
                        key: 'ir',
                        componentName: 'cohort-definition-browser',
                        componentParams: {
                            onSelect: cohort => this.cohortSelected(cohort)
                        }
                    },
                    {
                        title: ko.i18n('tagging.tabs.multiAssign', 'Cohort Pathways'),
                        key: 'pathways',
                        componentName: 'cohort-definition-browser',
                        componentParams: {
                            onSelect: cohort => this.cohortSelected(cohort)
                        }
                    },
                ]
            });
        }

        isAssignPermitted = () => authApi.isPermittedTagsGroupAssign() || !config.userAuthenticationEnabled;
        isUnassignPermitted = () => authApi.isPermittedTagsGroupUnassign() || !config.userAuthenticationEnabled;
        hasEnoughSelectedData = () => this.tags().length > 0 &&
            (this.selectedConceptSets().length > 0 || this.selectedCohorts().length > 0 || this.selectedCharacterizations().length > 0 ||
                this.selectedIncidenceRates().length > 0 || this.selectedPathways().length > 0);

        async getTags() {
            const res = await this.loadAvailableTags();
            this.availableTags(res.filter(t => t.groups && t.groups.length > 0));
        }

        selectTag(tag) {
            if (this.tags.indexOf(tag) < 0) {
                this.tags.push(tag);
                this.availableTags.valueHasMutated();
            }
        }

        unselectTag(tag) {
            this.tags.remove(t => t.id === tag.id);
            this.availableTags.valueHasMutated();
        }

        selectAssetTab(index, { key }) {
            this.selectedAssetTabKey(key);
        }

        conceptSetSelected(conceptSet) {
            this.checkAndAdd(this.selectedConceptSets, conceptSet);
        }

        unselectConceptSet(conceptSet) {
            this.selectedConceptSets.remove(cs => cs.id === conceptSet.id);
        }

        cohortSelected(cohort) {
            this.checkAndAdd(this.selectedCohorts, cohort);
        }

        unselectCohort(cohort) {
            this.selectedCohorts.remove(c => c.id === cohort.id);
        }

        characterizationSelected(characterization) {
            this.checkAndAdd(this.selectedCharacterizations, characterization);
        }

        unselectCharacterization(characterization) {
            this.selectedCharacterizations.remove(c => c.id === characterization.id);
        }

        incidenceRateSelected(ir) {
            this.checkAndAdd(this.selectedIncidenceRates, ir);
        }

        unselectIncidenceRate(ir) {
            this.selectedIncidenceRates.remove(i => i.id === ir.id);
        }

        pathwaySelected(pathway) {
            this.checkAndAdd(this.selectedPathways, pathway);
        }

        unselectPathway(pathway) {
            this.selectedPathways.remove(p => p.id === pathway.id);
        }

        doAssign() {
            TagsService.multiAssign(this.collectData());
            this.assetTabsParams.valueHasMutated();
            this.clear();
        }

        doUnassign() {
            TagsService.multiUnassign(this.collectData());
            this.assetTabsParams.valueHasMutated();
            this.clear();
        }

        collectData() {
            return {
                tags: this.tags().map(t => t.id),
                assets: {
                    conceptSets: this.selectedConceptSets().map(cs => cs.id),
                    cohorts: this.selectedCohorts().map(c => c.id),
                    characterizations: this.selectedCharacterizations().map(c => c.id),
                    incidenceRates: this.selectedIncidenceRates().map(ir => ir.id),
                    pathways: this.selectedPathways().map(p => p.id),
                }
            };
        }

        checkAndAdd(arr, asset) {
            if (arr.indexOf(asset) < 0) {
                arr.push(asset);
            }
        }

        clear() {
            this.tags([]);
            this.selectedConceptSets([]);
            this.selectedCohorts([]);
            this.selectedCharacterizations([]);
            this.selectedIncidenceRates([]);
            this.selectedPathways([]);
        }
    }

    return commonUtils.build('multi-assign', TagsMultiAssign, view);
});
