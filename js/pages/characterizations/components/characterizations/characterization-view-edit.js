define([
    'knockout',
    'pages/characterizations/services/CharacterizationService',
    'pages/characterizations/services/PermissionService',
    'services/Permission',
    'services/Tags',
    'components/security/access/const',
    'components/cohortbuilder/CriteriaGroup',
    'components/conceptset/InputTypes/ConceptSet',
    'components/conceptset/ConceptSetStore',
    './CharacterizationAnalysis',
    'text!./characterization-view-edit.html',
    'appConfig',
    'atlas-state',
    'services/AuthAPI',
    'pages/Page',
    'utils/AutoBind',
    'utils/CommonUtils',
    'utils/ExceptionUtils',
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
    'components/tags/modal/tags-modal',
    'components/checks/warnings',
    'components/name-validation',
    'components/versions/versions'
], function (
    ko,
    CharacterizationService,
    PermissionService,
    GlobalPermissionService,
    TagsService,
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
    exceptionUtils,
    ohdsiUtil,
    constants,
    lodash
) {
    class CharacterizationViewEdit extends AutoBind(Page) {
        constructor(params) {
            super(params);
            this.design = sharedState.CohortCharacterization.current;
            this.previewVersion = sharedState.CohortCharacterization.previewVersion;
            this.characterizationId = sharedState.CohortCharacterization.selectedId;
            this.conceptSetStore = ConceptSetStore.getStore(ConceptSetStore.sourceKeys().characterization);
            this.conceptSets = ko.computed(() => this.design() && this.design().strataConceptSets)            
            this.executionId = ko.observable(params.router.routerParams().executionId);
            this.selectedSourceId = ko.observable(params.router.routerParams().sourceId);
            this.areStratasNamesEmpty = ko.observable();
            this.duplicatedStrataNames = ko.observable([]);
            this.enablePermissionManagement = config.enablePermissionManagement;	        
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
                    } else if (this.previewVersion()) {
                        return ko.i18nformat('cc.viewEdit.captionPreview', 'Characterization #<%=id%> - Version <%=number%> Preview', {id: this.characterizationId(), number: this.previewVersion().version})();
                    } else {
                        return ko.i18nformat('cc.viewEdit.caption', 'Characterization #<%=id%>', {id: this.characterizationId()})();
                    }
                }
            });

            const onCohortDefinitionChanged = sharedState.CohortCharacterization.onCohortDefinitionChanged;

            sharedState.CohortCharacterization.onCohortDefinitionChanged = onCohortDefinitionChanged || sharedState.CohortDefinition.lastUpdatedId.subscribe(updatedCohortId => {
                if (this.design() && updatedCohortId && this.design().cohorts && this.design().cohorts().filter(c => c.id === updatedCohortId).length > 0) {
                    this.loadDesignData(this.characterizationId(), null, true);
                }
            });

            GlobalPermissionService.decorateComponent(this, {
                entityTypeGetter: () => entityType.COHORT_CHARACTERIZATION,
                entityIdGetter: () => this.characterizationId(),
                createdByUsernameGetter: () => this.design() && lodash.get(this.design(), 'createdBy.login')
            });

            TagsService.decorateComponent(this, {
                assetTypeGetter: () => TagsService.ASSET_TYPE.COHORT_CHARACTERIZATION,
                assetGetter: () => this.design(),
                addTagToAsset: (tag) => {
                    const isDirty = this.designDirtyFlag().isDirty();
                    this.design().tags.push(tag);
                    if (!isDirty) {
                        this.designDirtyFlag().reset();
                        this.warningParams.valueHasMutated();
                    }
                },
                removeTagFromAsset: (tag) => {
                    const isDirty = this.designDirtyFlag().isDirty();
                    this.design().tags(this.design().tags()
                        .filter(t => t.id !== tag.id && tag.groups.filter(tg => tg.id === t.id).length === 0));
                    if (!isDirty) {
                        this.designDirtyFlag().reset();
                        this.warningParams.valueHasMutated();
                    }
                }
            });

            this.versionsParams = ko.observable({
                versionPreviewUrl: (versionNumber) => `/cc/characterizations/${this.design().id}/version/${versionNumber}`,
                currentVersion: () => this.design(),
                previewVersion: () => this.previewVersion(),
                getList: () => this.design().id ? CharacterizationService.getVersions(this.design().id) :[],
                updateVersion: (version) => CharacterizationService.updateVersion(version),
                copyVersion: async (version) => {
                    this.isCopying(true);
                    try {
                        const result = await CharacterizationService.copyVersion(this.design().id, version.version);
                        this.previewVersion(null);
                        commonUtils.routeTo(`/cc/characterizations/${result.id}`);
                    } catch (ex) {
                        alert(exceptionUtils.extractServerMessage(ex));
                    } finally {
                        this.isCopying(false);
                    }
                },
                isAssetDirty: () => this.designDirtyFlag().isDirty(),
                canAddComments: () => this.isEditPermitted()
            });
        }

        onRouterParamsChanged(params, newParams) {
            const { characterizationId, section, executionId, sourceId, version } = Object.assign({}, params, newParams);
            if (version === 'current') {
                this.previewVersion(null);
            }

            if (characterizationId !== undefined) {
                this.characterizationId(parseInt(characterizationId));
                this.loadDesignData(this.characterizationId() || 0, version);
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

        backToCurrentVersion() {
            if (this.designDirtyFlag().isDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
                return;
            }
            commonUtils.routeTo(`/cc/characterizations/${this.design().id}/version/current`);
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
            return ko.computed(() => this.isEditPermitted() && (this.designDirtyFlag().isDirty() || this.previewVersion()) && this.isNameCorrect() && !this.areStratasNamesEmpty() && this.duplicatedStrataNames().length === 0);
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

        async loadDesignData(id, version, force = false) {
            if (!force && this.design() && (this.design().id || 0) === id && !version) {
                return;
            }
            if (id < 1) {
                this.setupDesign(new CharacterizationAnalysis());
            } else {
                try {
                    this.loading(true);
                    let design;
                    if (version && version !== 'current') {
                        const designVersion = await CharacterizationService.getVersion(id, version);
                        design = designVersion.entityDTO;
                        this.previewVersion(designVersion.versionDTO);
                    } else {
                        design = await CharacterizationService.loadCharacterizationDesign(id);
                    }
                    this.setupDesign(new CharacterizationAnalysis(design));
                    this.versionsParams.valueHasMutated();
                } catch (ex) {
                    alert(exceptionUtils.extractServerMessage(ex));
                } finally {
                    this.loading(false);
                }
            }
        }

        selectTab(index, { key }) {
            commonUtils.routeTo('/cc/characterizations/' + this.componentParams().characterizationId() + '/' + key);
        }

        async save() {
            if (this.previewVersion() && !confirm(ko.i18n('common.savePreviewWarning', 'Save as current version?')())) {
                return;
            }
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
                    this.previewVersion(null);
                    this.versionsParams.valueHasMutated();
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
                    this.versionsParams.valueHasMutated();
                    this.isCopying(false);
                    commonUtils.routeTo(`cc/characterizations/${res.id}`);
                });
        }

        deleteCc() {
            if (confirm(ko.unwrap(ko.i18n('cc.viewEdit.deleteConfirmation', 'Delete cohort characterization? Warning: deletion can not be undone!')))) {
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
            if (this.designDirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('cc.modals.confirmChanges', 'Your changes are not saved. Would you like to continue?')))) {
                return;
            }
            this.design(null);
            this.designDirtyFlag().reset();
            this.conceptSetStore.clear();
            this.previewVersion(null);
            commonUtils.routeTo('/cc/characterizations');
        }

        async afterImportSuccess(res) {
            this.design(null);
            this.previewVersion(null);
            this.designDirtyFlag().reset();
            commonUtils.routeTo('/cc/characterizations/' + res.id);
		};

        getAuthorship() {
            const design = this.design();

            let createdText, createdBy, createdDate, modifiedBy, modifiedDate;

            if (this.previewVersion()) {
                createdText = ko.i18n('components.authorship.versionCreated', 'version created');
                createdBy = lodash.get(this.previewVersion(), 'createdBy.name');
                createdDate = commonUtils.formatDateForAuthorship(this.previewVersion().createdDate);
                modifiedBy = null;
                modifiedDate = null;
            } else {
                createdText = ko.i18n('components.authorship.created', 'created');
                createdBy = lodash.get(design, 'createdBy.name');
                createdDate = commonUtils.formatDateForAuthorship(design.createdDate);
                modifiedBy = lodash.get(design, 'modifiedBy.name');
                modifiedDate = commonUtils.formatDateForAuthorship(design.modifiedDate);
            }

            if (!createdBy) {
                createdBy = ko.i18n('common.anonymous', 'anonymous');
            }

            if (modifiedDate && !modifiedBy) {
                modifiedBy = ko.i18n('common.anonymous', 'anonymous');
            }

            return {
                createdText: createdText,
                createdBy: createdBy,
                createdDate: createdDate,
                modifiedBy: modifiedBy,
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
