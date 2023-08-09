define([
	'knockout',
	'text!./manager.html',
	'../PathwayService',
	'../PermissionService',
	'services/Permission',
	'services/Tags',
	'components/security/access/const',
	'../PathwayAnalysis',
	'atlas-state',
	'appConfig',
	'services/AuthAPI',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/ExceptionUtils',
	'assets/ohdsi.util',
	'const',
	'lodash',
	'less!./manager.less',
	'components/tabs',
	'./tabs/pathway-design',
	'./tabs/pathway-exec-wrapper',
	'./tabs/pathway-results',
	'./tabs/pathway-utils',
	'faceted-datatable',
	'components/security/access/configure-access-modal',
	'components/tags/modal/tags-modal',
	'components/checks/warnings',
	'components/heading',
	'components/authorship',
	'components/name-validation',
	'components/versions/versions'
], function (
	ko,
	view,
	PathwayService,
	PermissionService,
	GlobalPermissionService,
	TagsService,
	{ entityType },
	PathwayAnalysis,
	sharedState,
	config,
	authApi,
	Page,
	AutoBind,
	commonUtils,
	exceptionUtils,
	ohdsiUtil,
	constants,
	lodash
) {
	class PathwaysManager extends AutoBind(Page) {
		constructor(params) {
			super(params);

			this.design = sharedState.CohortPathways.current;
			this.previewVersion = sharedState.CohortPathways.previewVersion;
			this.dirtyFlag = sharedState.CohortPathways.dirtyFlag;
			this.enablePermissionManagement = config.enablePermissionManagement;	 
			this.executionId = ko.observable(params.router.routerParams().executionId);
			this.selectedSourceId = ko.observable(params.router.routerParams().sourceId);
			this.analysisId = ko.observable();
			this.executionId = ko.observable();
			this.loading = ko.observable(false);
			this.isAuthenticated = ko.pureComputed(() => {
				return authApi.isAuthenticated();
			});
			this.defaultName = ko.unwrap(constants.newEntityNames.pathway);

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
			this.canEdit = this.isEditPermittedResolver();
			this.canSave = this.isSavePermittedResolver();
			this.canDelete = this.isDeletePermittedResolver();
			this.isNewEntity = this.isNewEntityResolver();
			this.canCopy = this.canCopyResolver();

			this.selectedTabKey = ko.observable("design");
			this.criticalCount = ko.observable(0);
			this.isDiagnosticsRunning = ko.observable(false);

			this.componentParams = ko.observable({
				design: this.design,
				analysisId: this.analysisId,
				executionId: this.executionId,
				dirtyFlag: this.dirtyFlag,
				criticalCount: this.criticalCount,
				isEditPermitted: this.canEdit,
        		selectedSourceId: this.selectedSourceId,
				afterImportSuccess: this.afterImportSuccess.bind(this),
			});
			this.warningParams = ko.observable({
				current: sharedState.CohortPathways.current,
				warningsTotal: ko.observable(0),
				warningCount: ko.observable(0),
				infoCount: ko.observable(0),
				criticalCount: this.criticalCount,
				changeFlag: ko.pureComputed(() => this.dirtyFlag().isChanged()),
				isDiagnosticsRunning: this.isDiagnosticsRunning,
				onDiagnoseCallback: this.diagnose.bind(this),
			});
			this.pathwayCaption = ko.computed(() => {
				if (this.design() && this.design().id !== undefined && this.design().id !== 0) {
					if (this.previewVersion()) {
						return ko.i18nformat('pathways.manager.captionVersion', 'Cohort Pathway #<%=id%> - Version <%=number%> Preview', {id: this.design().id, number: this.previewVersion().version})();
					} else {
						return ko.i18nformat('pathways.manager.caption', 'Cohort Pathway #<%=id%>', {id: this.design().id})();
					}
				}
				return this.defaultName;
			});
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.PATHWAY_ANALYSIS,
				entityIdGetter: () => this.analysisId(),
				createdByUsernameGetter: () => this.design() && lodash.get(this.design(), 'createdBy.login')
			});

			TagsService.decorateComponent(this, {
				assetTypeGetter: () => TagsService.ASSET_TYPE.PATHWAY_ANALYSIS,
				assetGetter: () => this.design(),
				addTagToAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.design().tags.push(tag);
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				},
				removeTagFromAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.design().tags(this.design().tags()
						.filter(t => t.id !== tag.id && tag.groups.filter(tg => tg.id === t.id).length === 0));
					if (!isDirty) {
						this.dirtyFlag().reset();
						this.warningParams.valueHasMutated();
					}
				}
			});

			this.versionsParams = ko.observable({
				versionPreviewUrl: (version) => `/pathways/${this.design().id}/version/${version}`,
				currentVersion: () => this.design(),
				previewVersion: () => this.previewVersion(),
				getList: () => this.design().id ? PathwayService.getVersions(this.design().id) : [],
				updateVersion: (version) => PathwayService.updateVersion(version),
				copyVersion: async (version) => {
					this.isCopying(true);
					try {
						const result = await PathwayService.copyVersion(this.design().id, version.version);
						this.previewVersion(null);
						commonUtils.routeTo(commonUtils.getPathwaysUrl(result.id, 'design'));
					} catch (ex) {
						alert(exceptionUtils.extractServerMessage(ex));
					} finally {
						this.isCopying(false);
					}
				},
				isAssetDirty: () => this.dirtyFlag().isDirty(),
				canAddComments: () => this.canEdit()
			});
		}

		onRouterParamsChanged(params, newParams) {
			const {analysisId, section,  executionId, sourceId, version} = Object.assign({}, params, newParams);

			if (analysisId !== undefined) {
				this.analysisId(parseInt(analysisId));
				this.load(this.analysisId() || 0, version);
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
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			commonUtils.routeTo(`/pathways/${this.design().id}/version/current`);
		}

		selectTab(index, { key }) {
			commonUtils.routeTo(commonUtils.getPathwaysUrl(this.componentParams().analysisId(), key));
		}

		diagnose() {
			if (this.design()) {
				return PathwayService.runDiagnostics(this.design());
			}
		}

		setupDesign(design) {
			this.design(design);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.design()));
		}

		setupSection(section) {
				const tabKey = section === 'results' ? 'executions' : section;
				this.selectedTabKey(tabKey || 'design');
		}

		isViewPermittedResolver() {
			return ko.computed(
				() => PermissionService.isPermittedLoad(this.analysisId())
			);
		}

		isEditPermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedUpdate(this.analysisId()) : PermissionService.isPermittedCreate())
				);
		}

		isSavePermittedResolver() {
				return ko.computed(() => this.canEdit() && (this.dirtyFlag().isDirty() || this.previewVersion()) && this.isNameCorrect());
		}

		isDeletePermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedDelete(this.analysisId()) : false)
				);
		}

		isNewEntityResolver() {
			return ko.computed(() => this.design() && this.analysisId() === 0);
		}

		canCopyResolver() {
			return ko.computed(() => !this.dirtyFlag().isDirty() && PermissionService.isPermittedCopy(this.analysisId()));
		}

		async load(id, version) {
			if (this.design() && (this.design().id === id || 0 === id) && !version) return; // this design is already loaded.

			if (id < 1) {
				this.setupDesign(new PathwayAnalysis());
			} else {
				this.loading(true);
				try {
					let analysis;
					if (version && version !== 'current') {
						const analysisVersion = await PathwayService.getVersion(id, version);
						analysis = analysisVersion.entityDTO;
						this.previewVersion(analysisVersion.versionDTO);
					} else {
						analysis = await PathwayService.load(id);
						this.previewVersion(null);
					}
					this.setupDesign(new PathwayAnalysis(analysis));
				} catch (ex) {
					alert(exceptionUtils.extractServerMessage(ex));
				} finally {
					this.loading(false);
				}
			}
		}

		async save() {
			if (this.previewVersion() && !confirm(ko.i18n('common.savePreviewWarning', 'Save as current version?')())) {
				return;
			}
			this.isSaving(true);

			let pathwayName = this.design().name();
			this.design().name(pathwayName.trim());

			// Next check to see that a cohort pathway with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current cohort pathway is excluded in this check.
			try {
				const results = await PathwayService.exists(this.design().name(), this.design().id === undefined ? 0 : this.design().id);
				if (results > 0) {
					alert(ko.unwrap(ko.i18n('pathways.manager.messages.alreadyExists', 'A cohort pathway with this name already exists. Please choose a different name.')));
				} else {
					if (!this.design().id) {
						const newAnalysis = await PathwayService.create(this.design());
						this.dirtyFlag().reset();
						commonUtils.routeTo(commonUtils.getPathwaysUrl(newAnalysis.id, 'design'));
					} else {
						const updatedAnalysis = await PathwayService.save(this.design().id, this.design());
						this.setupDesign(new PathwayAnalysis(updatedAnalysis));
					}
					this.previewVersion(null);
					this.versionsParams.valueHasMutated();
				}
			} catch (e) {
				alert(ko.unwrap(ko.i18n('pathways.manager.messages.saveFailed', 'An error occurred while attempting to save a cohort pathway.')));
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		async copyPathway() {
			this.isCopying(true);
			const copiedAnalysis = await PathwayService.copy(this.design().id);
			this.setupDesign(new PathwayAnalysis(copiedAnalysis));
			this.versionsParams.valueHasMutated();
			this.isCopying(false);
			commonUtils.routeTo(commonUtils.getPathwaysUrl(copiedAnalysis.id, 'design'));
		}

		async del() {
			if (confirm(ko.unwrap(ko.i18n('pathways.manager.messages.deleteConfirmation', 'Are you sure?')))) {
				this.isDeleting(true);
				this.loading(true);
				await PathwayService.del(this.design().id);
				this.dirtyFlag().reset();
				this.loading(false);
				this.close();
			}
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('pathways.manager.messages.beforeClose', 'Your changes are not saved. Would you like to continue?')))) {
				return;
			}
			this.design(null);
			this.previewVersion(null);
			this.dirtyFlag().reset();

			commonUtils.routeTo('/pathways');
		}

		async afterImportSuccess(res) {
			this.warningParams().checkOnInit = false;
			this.design(null);
			this.previewVersion(null);
			this.dirtyFlag().reset();
			commonUtils.routeTo('/pathways/' + res.id);
		};

		getAuthorship() {
			const analysis = this.design();

			let createdText, createdBy, createdDate, modifiedBy, modifiedDate;

			if (this.previewVersion()) {
				createdText = ko.i18n('components.authorship.versionCreated', 'version created');
				createdBy = lodash.get(this.previewVersion(), 'createdBy.name');
				createdDate = commonUtils.formatDateForAuthorship(this.previewVersion().createdDate);
				modifiedBy = null;
				modifiedDate = null;
			} else {
				createdText = ko.i18n('components.authorship.created', 'created');
				createdBy = lodash.get(analysis, 'createdBy.name');
				createdDate = commonUtils.formatDateForAuthorship(analysis.createdDate);
				modifiedBy = lodash.get(analysis, 'modifiedBy.name');
				modifiedDate = commonUtils.formatDateForAuthorship(analysis.modifiedDate);
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

	}

	return commonUtils.build('pathways-manager', PathwaysManager, view);
});
