define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'services/Permission',
    'components/security/access/const',
    'components/cohortbuilder/CriteriaGroup',
    'conceptsetbuilder/InputTypes/ConceptSet',
    'components/conceptset/ConceptSetStore',
    './CharacterizationAnalysis',
    'text!./characterization-view-edit.html',
    'appConfig',
    'atlas-state',
    'services/AuthAPI',
    'pages/Page',
    'utils/AutoBind',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'const',
    'lodash',
    'less!./characterization-view-edit.less',
    'components/tabs',
    'faceted-datatable',
    './characterization-view-edit/characterization-design',
    './characterization-view-edit/characterization-exec-wrapper',
    './characterization-view-edit/characterization-utils',
    './characterization-view-edit/characterization-conceptsets',
    'components/ac-access-denied',
    'components/heading',
    'components/authorship',
    'components/security/access/configure-access-modal',
    'components/checks/warnings',
    'components/name-validation',
], function (
    ko,
    CharacterizationService,
    PermissionService,
    GlobalPermissionService,
    { entityType },
    CriteriaGroup,
    ConceptSet,
    ConceptSetStore,
    CharacterizationAnalysis,
    view,
    config,
    sharedState,
    authApi,
    Page,
    AutoBind,
    commonUtils,
    ohdsiUtil,
    constants,
    lodash
) {
    class CharacterizationViewEdit extends AutoBind(Page) {
        constructor(params) {
            super(params);
            this.design = sharedState.CohortCharacterization.current;
            this.characterizationId = sharedState.CohortCharacterization.selectedId;
            this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().characterization);
            this.conceptSets = ko.computed(() => this.design() && this.design().strataConceptSets)            
            this.executionId = ko.observable(params.router.routerParams().executionId);
            this.selectedSourceId = ko.observable(params.router.routerParams().sourceId);
            this.areStratasNamesEmpty = ko.observable();
            this.duplicatedStrataNames = ko.observable([]);

            this.designDirtyFlag = sharedState.CohortCharacterization.dirtyFlag;
            this.loading = ko.observable(false);
            this.defaultName = ko.unwrap(constants.newEntityNames.characterization);
            this.isAuthenticated = ko.pureComputed(() => {
                return authApi.isAuthenticated();
            });
            this.isNameFilled = ko.computed(() => {
                return this.design() && this.design().name() && this.design().name().trim();
            });
            this.isNameCharactersValid = ko.computed(() => {
                return this.isNameFilled() && commonUtils.isNameCharactersValid(this.design().name());
            });
            this.isNameLengthValid = ko.computed(() => {
                return this.isNameFilled() && commonUtils.isNameLengthValid(this.design().name());
            });
            this.isDefaultName = ko.computed(() => {
                return this.isNameFilled() && this.design().name().trim() === this.defaultName;
            });
            this.isNameCorrect = ko.computed(() => {
                return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
            });
            this.isViewPermitted = this.isViewPermittedResolver();
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
            this.criticalCount = ko.observable(0);
            this.isDiagnosticsRunning = ko.observable(false);
            
            this.componentParams = ko.observable({
                ...params,
								canEdit: this.isEditPermitted,
                characterizationId: this.characterizationId,
                design: this.design,
                executionId: this.executionId,
                designDirtyFlag: this.designDirtyFlag,
                areStratasNamesEmpty: this.areStratasNamesEmpty,
                duplicatedStrataNames: this.duplicatedStrataNames,
                conceptSets: this.conceptSets,
                conceptSetStore: this.conceptSetStore,
                loadConceptSet: this.loadConceptSet,
                criticalCount: this.criticalCount,
                isEditPermitted: this.isEditPermitted,
                selectedSourceId: this.selectedSourceId,
                afterImportSuccess: this.afterImportSuccess.bind(this),
            });
            this.warningParams = ko.observable({
                current: sharedState.CohortCharacterization.current,
                warningsTotal: ko.observable(0),
                warningCount: ko.observable(0),
                infoCount: ko.observable(0),
                criticalCount: this.criticalCount,
                changeFlag: ko.pureComputed(() => this.designDirtyFlag().isChanged()),
                isDiagnosticsRunning: this.isDiagnosticsRunning,
                onDiagnoseCallback: this.diagnose.bind(this),
            });
            this.characterizationCaption = ko.pureComputed(() => {
                if (this.design()) {
                    if (this.characterizationId() === 0) {
                        return this.defaultName;
                    } else {
                        return ko.i18nformat('cc.viewEdit.caption', 'Characterization #<%=id%>', {id: this.characterizationId()})();
                    }
                }
            });

            const onCohortDefinitionChanged = sharedState.CohortCharacterization.onCohortDefinitionChanged;

            sharedState.CohortCharacterization.onCohortDefinitionChanged = onCohortDefinitionChanged || sharedState.CohortDefinition.lastUpdatedId.subscribe(updatedCohortId => {
                if (this.design() && updatedCohortId && this.design().cohorts && this.design().cohorts().filter(c => c.id === updatedCohortId).length > 0) {
                    this.loadDesignData(this.characterizationId(), true);
                }
            });

            GlobalPermissionService.decorateComponent(this, {
                entityTypeGetter: () => entityType.COHORT_CHARACTERIZATION,
                entityIdGetter: () => this.characterizationId(),
                createdByUsernameGetter: () => this.design() && lodash.get(this.design(), 'createdBy.login')
            });
        }

        onRouterParamsChanged({ characterizationId, section, executionId, sourceId }) {
            if (characterizationId !== undefined) {
                this.characterizationId(parseInt(characterizationId));
                this.loadDesignData(this.characterizationId() || 0);
            }

            if (section !== undefined) {
                this.setupSection(section);
            }

            if (executionId !== undefined) {
                this.executionId(executionId);
            }
            if (sourceId !== undefined) {
                this.selectedSourceId(sourceId);
            }
        }

        isViewPermittedResolver() {
            return ko.pureComputed(
                () => PermissionService.isPermittedGetCC(this.characterizationId())
            );
        }

        isEditPermittedResolver() {
            return ko.pureComputed(
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

        diagnose() {
            if (this.design()) {
                return CharacterizationService.runDiagnostics(this.design());
            }
        }

        async loadDesignData(id, force = false) {
            if (!force && this.design() && (this.design().id || 0) === id) {
                return;
            }
            if (this.designDirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('cc.modals.confirmChanges', 'Your changes are not saved. Would you like to continue?')))) {
                return;
            }
            if (id < 1) {
                this.setupDesign(new CharacterizationAnalysis());
            } else {
                try {
                    this.loading(true);
                    const res = await CharacterizationService.loadCharacterizationDesign(id);
                    this.setupDesign(new CharacterizationAnalysis(res));
                } finally {
                    this.loading(false);
                }
            }
        }

        selectTab(index, { key }) {
            commonUtils.routeTo('/cc/characterizations/' + this.componentParams().characterizationId() + '/' + key);
        }

        async save() {
            this.isSaving(true);
            const ccId = this.componentParams().characterizationId();

            let characterizationName = this.design().name();
            this.design().name(characterizationName.trim());

            // Next check to see that a characterization with this name does not already exist
            // in the database. Also pass the id so we can make sure that the current characterization is excluded in this check.
            try {
                const results = await CharacterizationService.exists(this.design().name(), ccId);
                if (results > 0) {
                    alert('A characterization with this name already exists. Please choose a different name.');
                } else {
                    if (ccId < 1) {
                        const newCharacterization = await CharacterizationService.createCharacterization(this.design());
                        this.designDirtyFlag(new ohdsiUtil.dirtyFlag(this.design));                        
                        commonUtils.routeTo(`/cc/characterizations/${newCharacterization.id}/${this.selectedTabKey()}`);
                    } else {
                        const updatedCharacterization = await CharacterizationService.updateCharacterization(ccId, this.design());
                        this.setupDesign(new CharacterizationAnalysis(updatedCharacterization));
                    }
                }
            } catch (e) {
                alert('An error occurred while attempting to save a characterization.');
            } finally {
                this.isSaving(false);
                this.loading(false);
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
            if (this.designDirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('cc.modals.confirmChanges', "Your changes are not saved. Would you like to continue?")))) {
                return;
            }
            this.design(null);
            this.designDirtyFlag().reset();
            this.conceptSetStore.clear();
            commonUtils.routeTo('/cc/characterizations');
        }

        async afterImportSuccess(res) {
            this.design(null);
            this.designDirtyFlag().reset();
            commonUtils.routeTo('/cc/characterizations/' + res.id);
		};

        getAuthorship() {
            const createdDate = commonUtils.formatDateForAuthorship(this.design().createdDate);
            const modifiedDate = commonUtils.formatDateForAuthorship(this.design().modifiedDate);
            return {
                createdBy: lodash.get(this.design(), 'createdBy.name'),
                createdDate: createdDate,
                modifiedBy: lodash.get(this.design(), 'modifiedBy.name'),
                modifiedDate: modifiedDate,
            }
        }
        
        loadConceptSet(conceptSetId) {
            this.conceptSetStore.current(this.conceptSets()().find(item => item.id == conceptSetId));
            this.conceptSetStore.isEditable(this.isEditPermitted());
            commonUtils.routeTo(`/cc/characterizations/${this.design().id}/conceptsets`);
        }   
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
