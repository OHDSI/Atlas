define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'text!./characterization-view-edit.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Page',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'less!./characterization-view-edit.less',
    'components/tabs',
    'faceted-datatable',
    './characterization-view-edit/characterization-design',
    './characterization-view-edit/characterization-exec-wrapper',
    './characterization-view-edit/characterization-utils',
    'components/ac-access-denied',
], function (
    ko,
    CharacterizationService,
    PermissionService,
    view,
    config,
    authApi,
    Page,
    commonUtils,
    ohdsiUtil
) {
    class CharacterizationViewEdit extends Page {
        constructor(params) {
            super(params);

            this.selectTab = this.selectTab.bind(this);
            this.setupDesign = this.setupDesign.bind(this);
            this.setupSection = this.setupSection.bind(this);
            this.loadDesignData = this.loadDesignData.bind(this);

            this.characterizationId = ko.observable();
            this.executionId = ko.observable();
            this.design = ko.observable({});

            this.designDirtyFlag = ko.observable({ isDirty: () => false });
            this.loading = ko.observable(false);
            this.isEditPermitted = this.isEditPermittedResolver();
            this.isSavePermitted = this.isSavePermittedResolver();
            this.isDeletePermitted = this.isDeletePermittedResolver();

            this.selectedTabKey = ko.observable();
            this.componentParams = ko.observable({
                characterizationId: this.characterizationId,
                design: this.design,
                executionId: this.executionId,
            });
        }

        onRouterParamsChanged({ characterizationId, section, subId }) {
            if (characterizationId !== undefined) {
                this.characterizationId(parseInt(characterizationId));
                if (this.characterizationId() === 0) {
                    this.setupDesign({});
                } else {
                    this.loadDesignData(this.characterizationId());
                }
            }

            if (section !== undefined) {
                this.setupSection(section);
            }

            if (subId !== undefined) {
                this.executionId(subId);
            }
        }

        isEditPermittedResolver() {
            return ko.computed(
                () => (this.characterizationId() ? PermissionService.isPermittedUpdateCC(this.characterizationId()) : PermissionService.isPermittedCreateCC())
            );
        }

        isSavePermittedResolver() {
            return ko.computed(() => this.isEditPermitted() && this.designDirtyFlag().isDirty())
        }

        isDeletePermittedResolver() {
            return ko.computed(
                () => PermissionService.isPermittedDeleteCC(this.characterizationId())
            );
        }

        setupSection(section) {
            const tabKey = section === 'results' ? 'executions' : section;
            this.selectedTabKey(tabKey);
        }

        setupDesign(design) {
            this.design({
                ...design,
                name: ko.observable(design.name),
            });
            this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design));
        }

        async loadDesignData(id) {
            if (id < 1) {
                this.setupDesign({})
            } else {
                this.loading(true);
                const res = await CharacterizationService.loadCharacterizationDesign(id);
                this.setupDesign(res);
                this.loading(false);
            }
        }

        selectTab(index, { key }) {
            commonUtils.routeTo('/cc/characterizations/' + this.componentParams().characterizationId() + '/' + key);
        }

        save() {
            const ccId = this.componentParams().characterizationId();

            if (ccId < 1) {
                CharacterizationService
                    .createCharacterization(this.design())
                    .then(res => commonUtils.routeTo('/cc/characterizations/' + res.id + '/design'));
            } else {
                CharacterizationService
                    .updateCharacterization(ccId, this.design())
                    .then(res => {
                        this.setupDesign(res);
                        this.loading(false);
                    });
            }
        }

        deleteCc() {
            if (confirm('Are you sure?')) {
                this.loading(true);
                CharacterizationService
                    .deleteCharacterization(this.componentParams().characterizationId())
                    .then(res => {
                        this.loading(false);
                        this.closeCharacterization();
                    });
            }
        }

        closeCharacterization() {
            commonUtils.routeTo('/cc/characterizations');
        }
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
