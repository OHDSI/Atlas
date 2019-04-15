define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'components/cohortbuilder/CriteriaGroup',
    'conceptsetbuilder/InputTypes/ConceptSet',
    './CharacterizationAnalysis',
    'text!./characterization-view-edit.html',
    'appConfig',
    'atlas-state',
    'services/AuthAPI',
    'pages/Page',
    'utils/AutoBind',
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
    CriteriaGroup,
    ConceptSet,
    CharacterizationAnalysis,
    view,
    config,
    sharedState,
    authApi,
    Page,
    AutoBind,
    commonUtils,
    ohdsiUtil
) {
    class CharacterizationViewEdit extends AutoBind(Page) {
        constructor(params) {
            super(params);
            this.characterizationId = sharedState.CohortCharacterization.selectedId;
            this.executionId = ko.observable();
            this.areStratasNamesEmpty = ko.observable();
            this.duplicatedStrataNames = ko.observable([]);
            this.design = sharedState.CohortCharacterization.current;

            this.designDirtyFlag = sharedState.CohortCharacterization.dirtyFlag;
            this.loading = ko.observable(false);
            this.isNameCorrect = ko.computed(() => {
                return this.design() && this.design().name();
            });
            this.isEditPermitted = this.isEditPermittedResolver();
            this.isSavePermitted = this.isSavePermittedResolver();
            this.isDeletePermitted = this.isDeletePermittedResolver();
            this.isSaving = ko.observable(false);
            this.isCopying = ko.observable(false);
            this.isDeleting = ko.observable(false);
            this.isProcessing = ko.computed(() => {
                return this.isSaving() || this.isCopying() || this.isDeleting();
            });
            this.canCopy = this.canCopyResolver();
            this.isNewEntity = this.isNewEntityResolver();

            this.selectedTabKey = ko.observable();
            this.componentParams = ko.observable({
                characterizationId: this.characterizationId,
                design: this.design,
                executionId: this.executionId,
                designDirtyFlag: this.designDirtyFlag,
                areStratasNamesEmpty: this.areStratasNamesEmpty,
                duplicatedStrataNames: this.duplicatedStrataNames,
            });
            this.characterizationCaption = ko.computed(() => {
                if (this.design()) {
                    if (this.characterizationId() === 0) {
                        return 'New Characterization';
                    } else {
                        return 'Characterization #' + this.characterizationId();
                    }
                }
            });
        }

        onRouterParamsChanged({ characterizationId, section, subId }) {
            if (characterizationId !== undefined) {
                this.characterizationId(parseInt(characterizationId));
                this.loadDesignData(this.characterizationId() || 0);
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
            return ko.computed(() => this.isEditPermitted() && this.designDirtyFlag().isDirty() && this.isNameCorrect() && !this.areStratasNamesEmpty() && this.duplicatedStrataNames().length === 0);
        }

        isDeletePermittedResolver() {
            return ko.computed(
                () => PermissionService.isPermittedDeleteCC(this.characterizationId())
            );
        }

        canCopyResolver() {
            return ko.computed(() => !this.designDirtyFlag().isDirty() && PermissionService.isPermittedCopyCC(this.characterizationId()));
        }

        isNewEntityResolver() {
            return ko.computed(
              () => this.design() && this.characterizationId() === 0
            );
        }

        setupSection(section) {
            const tabKey = section === 'results' ? 'executions' : section;
            this.selectedTabKey(tabKey);
        }

        setupDesign(design) {
            this.design(design);
            this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design()));
        }

        async loadDesignData(id) {

        if (this.design() && (this.design().id || 0) === id) return;
          if (this.designDirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?")) {
            return;
          }
            if (id < 1) {
                this.setupDesign(new CharacterizationAnalysis());
          } else {
            this.loading(true);
            const res = await CharacterizationService.loadCharacterizationDesign(id);
            this.setupDesign(new CharacterizationAnalysis(res));
            this.loading(false);
          }
        }

        selectTab(index, { key }) {
            commonUtils.routeTo('/cc/characterizations/' + this.componentParams().characterizationId() + '/' + key);
        }

        save() {
            this.isSaving(true);
            const ccId = this.componentParams().characterizationId();

            if (ccId < 1) {
                CharacterizationService
                    .createCharacterization(this.design())
                    .then(res => {
                        this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design));
                        this.isSaving(false);
                        commonUtils.routeTo(`/cc/characterizations/${res.id}/${this.selectedTabKey()}`);
                    });
            } else {
                CharacterizationService
                    .updateCharacterization(ccId, this.design())
                    .then(res => {
                        this.setupDesign(new CharacterizationAnalysis(res));
                        this.isSaving(false);
                        this.loading(false);
                    });
            }
        }

        copyCc() {
            this.isCopying(true);
            CharacterizationService.copyCharacterization(this.characterizationId())
                .then(res => {
                    this.setupDesign(new CharacterizationAnalysis(res));
                    this.isCopying(false);
                    commonUtils.routeTo(`cc/characterizations/${res.id}`);
                });
        }

        deleteCc() {
            if (confirm('Are you sure?')) {
                this.isDeleting(true);
                this.loading(true);
                CharacterizationService
                    .deleteCharacterization(this.componentParams().characterizationId())
                    .then(res => {
                        this.loading(false);
                        this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design));
                        this.closeCharacterization();
                    });
            }
        }

        closeCharacterization() {
            if (this.designDirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?")) {
                return;
            }
            this.design(null);
            this.designDirtyFlag().reset();
            commonUtils.routeTo('/cc/characterizations');
        }
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
