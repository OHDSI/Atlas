define([
    'knockout',
    'atlas-state',
    'text!./characterization-view-edit.html',
    './characterization-view-edit/characterization-design',
    './characterization-view-edit/characterization-executions',
    './characterization-view-edit/characterization-results',
    './characterization-view-edit/characterization-utils',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'text!pages/characterizations/stubs/characterization-design-data.json',
    'less!./characterization-view-edit.less',
    'components/tabs',
    'faceted-datatable',
], function (
    ko,
    sharedState,
    view,
    characterizationDesign,
    characterizationExecutions,
    characterizationResults,
    characterizationUtils,
    config,
    authApi,
    Component,
    commonUtils,
    ohdsiUtil,
    characterizationDesignData
) {
    class CharacterizationViewEdit extends Component {
        constructor(params) {
            super();

            this.params = params;

            this.selectTab = this.selectTab.bind(this);
            this.setupSection = this.setupSection.bind(this);
            this.loadDesignData = this.loadDesignData.bind(this);

            this.designDirtyFlag = ko.observable({ isDirty: () => false });
            this.design = ko.observable({});

            this.loading = ko.observable(false);
            this.canSave = ko.computed(() => {
               return this.designDirtyFlag().isDirty();
            });
            this.canEdit = this.canDelete = ko.computed(function () {
                return true;
            });

            this.sectionList = ['design', 'executions', 'results', 'utils'];
            this.selectedTab = ko.observable();
            this.componentParams = ko.observable({
                characterizationId: params.characterizationId,
                design: this.design,
                executionId: this.params.subId,
            });

            params.characterizationId.subscribe(id => this.loadDesignData(id));
            this.loadDesignData(params.characterizationId());

            params.section.subscribe(value => this.setupSection(value));
            this.setupSection(params.section());
        }

        setupSection(section) {
            const tabIdx = this.sectionList.indexOf(section);
            if (tabIdx > -1) {
                this.selectedTab(tabIdx);
            } else {
                commonUtils.routeTo('/cc/characterizations/' + this.componentParams().characterizationId() + '/design');
            }
        }

        loadDesignData() {
            this.loading(true);
            return new Promise(resolve => {
                setTimeout(
                    () => {
                        const designData = JSON.parse(characterizationDesignData);
                        this.design({
                            ...designData,
                            name: ko.observable(designData.name),
                        });
                        this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design));
                        this.loading(false);
                    },
                    2000
                );
            });
        }

        selectTab(index) {
            commonUtils.routeTo('/cc/characterizations/' + this.params.characterizationId() + '/' + this.sectionList[index]);
        }

        save() {
            console.log('Saving: ', JSON.parse(ko.toJSON(this.design)));
        }

        closeCharacterization() {
            commonUtils.routeTo('/cc/characterizations');
        }
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
