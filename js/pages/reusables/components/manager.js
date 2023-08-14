define([
	'knockout',
	'text!./manager.html',
	'services/ReusablesService',
	'../PermissionService',
	'services/Permission',
	'services/Tags',
	'components/security/access/const',
	'services/Reusable',
	'atlas-state',
	'appConfig',
	'services/AuthAPI',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/ExceptionUtils',
	'assets/ohdsi.util',
	'const',
	'../const',
	'lodash',
	'less!./manager.less',
	'components/tabs',
	'./tabs/reusable-design',
	'./tabs/reusable-concept-sets',
	'faceted-datatable',
	'components/security/access/configure-access-modal',
	'components/tags/modal/tags-modal',
	'components/heading',
	'components/authorship',
	'components/name-validation',
	'components/versions/versions'
], function (
	ko,
	view,
	ReusablesService,
	PermissionService,
	GlobalPermissionService,
	TagsService,
	{ entityType },
	Reusable,
	sharedState,
	config,
	authApi,
	Page,
	AutoBind,
	commonUtils,
	exceptionUtils,
	ohdsiUtil,
	constants,
	reusableConstants,
	lodash,
) {
	class ReusableManager extends AutoBind(Page) {
		constructor(params) {
			super(params);

			this.design = sharedState.Reusable.current;
			this.previewVersion = sharedState.Reusable.previewVersion;
			this.dirtyFlag = sharedState.Reusable.dirtyFlag;
			this.designId = ko.observable();
			this.loading = ko.observable(false);
			this.isAuthenticated = ko.pureComputed(() => {
				return authApi.isAuthenticated();
			});
			this.defaultName = ko.unwrap(constants.newEntityNames.reusable);

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
			this.enablePermissionManagement = config.enablePermissionManagement;	    
			    
			this.componentParams = ko.observable({
				design: this.previewVersion() ? this.previewVersion : this.design,
				designId: this.designId,
				dirtyFlag: this.dirtyFlag,
				isEditPermitted: this.canEdit,
				afterImportSuccess: this.afterImportSuccess.bind(this),
			});

			this.reusableCaption = ko.computed(() => {
				if (this.design() && this.design().id !== undefined && this.design().id !== 0) {
					if (this.previewVersion()) {
						return ko.i18nformat('reusables.manager.captionVersion', 'Reusable #<%=id%> - Version <%=number%> Preview', {id: this.design().id, number: this.previewVersion().version})();
					} else {
						return ko.i18nformat('reusables.manager.caption', 'Reusable #<%=id%>', {id: this.design().id})();
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
				entityTypeGetter: () => entityType.REUSABLE,
				entityIdGetter: () => this.designId(),
				createdByUsernameGetter: () => this.design() && lodash.get(this.design(), 'createdBy.login')
			});

			TagsService.decorateComponent(this, {
				assetTypeGetter: () => TagsService.ASSET_TYPE.REUSABLE,
				assetGetter: () => this.design(),
				addTagToAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.design().tags.push(tag);
					if (!isDirty) {
						this.dirtyFlag().reset();
					}
				},
				removeTagFromAsset: (tag) => {
					const isDirty = this.dirtyFlag().isDirty();
					this.design().tags(this.design().tags()
						.filter(t => t.id !== tag.id && tag.groups.filter(tg => tg.id === t.id).length === 0));
					if (!isDirty) {
						this.dirtyFlag().reset();
					}
				}
			});

			this.versionsParams = ko.observable({
				versionPreviewUrl: (version) => `/reusables/${this.design().id}/version/${version}`,
				currentVersion: () => this.design(),
				previewVersion: () => this.previewVersion(),
				getList: () => this.design().id ? ReusablesService.getVersions(this.design().id) : [],
				updateVersion: (version) => ReusablesService.updateVersion(version),
				copyVersion: async (version) => {
					this.isCopying(true);
					try {
						const result = await ReusablesService.copyVersion(this.design().id, version.version);
						this.previewVersion(null);
						commonUtils.routeTo(reusableConstants.getPageUrl(result.id, 'design'));
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
			const {designId, section,  version} = Object.assign({}, params, newParams);

			if (designId !== undefined) {
				this.designId(parseInt(designId));
				this.load(this.designId() || 0, version);
			}

            if (section !== undefined) {
                this.setupSection(section);
            }
		}

		backToCurrentVersion() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('common.unsavedWarning', 'Unsaved changes will be lost. Proceed?')())) {
				return;
			}
			commonUtils.routeTo(`/reusables/${this.design().id}/version/current`);
		}

		selectTab(index, { key }) {
			commonUtils.routeTo(reusableConstants.getPageUrl(this.componentParams().designId(), key));
		}

		setupDesign(design) {
			this.design(design);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.design()));
		}

		setupSection(section) {
			this.selectedTabKey(section || 'design');
		}

		isViewPermittedResolver() {
			return ko.computed(
				() => PermissionService.isPermittedLoad(this.designId())
			);
		}

		isEditPermittedResolver() {
				return ko.computed(
						() => (this.designId() ? PermissionService.isPermittedUpdate(this.designId()) : PermissionService.isPermittedCreate())
				);
		}

		isSavePermittedResolver() {
				return ko.computed(() => this.canEdit() && (this.dirtyFlag().isDirty() || this.previewVersion()) && this.isNameCorrect());
		}

		isDeletePermittedResolver() {
				return ko.computed(
						() => (this.designId() ? PermissionService.isPermittedDelete(this.designId()) : false)
				);
		}

		isNewEntityResolver() {
			return ko.computed(() => this.design() && this.designId() === 0);
		}

		canCopyResolver() {
			return ko.computed(() => !this.dirtyFlag().isDirty() && PermissionService.isPermittedCopy(this.designId()));
		}

		async load(id, version) {
			if (this.design() && (this.design().id === id || 0 === id) && !version) return; // this design is already loaded.

			if (id < 1) {
				this.setupDesign(new Reusable());
			} else {
				this.loading(true);
				try {
					let reusable;
					if (version && version !== 'current') {
						const reusableVersion = await ReusablesService.getVersion(id, version);
						reusable = reusableVersion.entityDTO;
						this.previewVersion(reusableVersion.versionDTO);
					} else {
						reusable = await ReusablesService.load(id);
						this.previewVersion(null);
					}
					this.setupDesign(new Reusable(reusable));
					this.componentParams.valueHasMutated();
					this.versionsParams.valueHasMutated();
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

			let reusableName = this.design().name();
			this.design().name(reusableName.trim());

			try {
				const exists = await ReusablesService.exists(this.design().name(), this.design().id === undefined ? 0 : this.design().id);
				if (exists) {
					alert(ko.unwrap(ko.i18n('reusables.manager.messages.alreadyExists', 'A reusable with this name already exists. Please choose a different name.')));
				} else {
					if (!this.design().id) {
						const newReusable = await ReusablesService.create(this.design());
						this.dirtyFlag().reset();
						commonUtils.routeTo(reusableConstants.getPageUrl(newReusable.id, 'design'));
					} else {
						const updatedReusable = await ReusablesService.save(this.designId(), this.design());
						this.setupDesign(new Reusable(updatedReusable));
					}
					this.previewVersion(null);
					this.versionsParams.valueHasMutated();
				}
			} catch (e) {
				alert(ko.unwrap(ko.i18n('reusables.manager.messages.saveFailed', 'An error occurred while attempting to save a reusable.')));
				console.error(e);
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		async copy() {
			this.isCopying(true);
			const copiedReusable = await ReusablesService.copy(this.design().id);
			this.setupDesign(new Reusable(copiedReusable));
			this.versionsParams.valueHasMutated();
			this.isCopying(false);
			commonUtils.routeTo(reusableConstants.getPageUrl(copiedReusable.id, 'design'));
		}

		async del() {
			if (confirm(ko.unwrap(ko.i18n('reusables.manager.messages.deleteConfirmation', 'Are you sure?')))) {
				this.isDeleting(true);
				this.loading(true);
				await ReusablesService.del(this.design().id);
				this.dirtyFlag().reset();
				this.loading(false);
				this.close();
			}
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.unwrap(ko.i18n('reusables.manager.messages.beforeClose', 'Your changes are not saved. Would you like to continue?')))) {
				return;
			}
			this.design(null);
			this.previewVersion(null);
			this.dirtyFlag().reset();

			commonUtils.routeTo('/reusables');
		}

		async afterImportSuccess(res) {
			this.design(null);
			this.previewVersion(null);
			this.dirtyFlag().reset();
			commonUtils.routeTo('/reusables/' + res.id);
		};

		getAuthorship() {
			const reusable = this.design();

			let createdText, createdBy, createdDate, modifiedBy, modifiedDate;

			if (this.previewVersion()) {
				createdText = ko.i18n('components.authorship.versionCreated', 'version created');
				createdBy = this.previewVersion().createdBy.name;
				createdDate = commonUtils.formatDateForAuthorship(this.previewVersion().createdDate);
				modifiedBy = null;
				modifiedDate = null;
			} else {
				createdText = ko.i18n('components.authorship.created', 'created');
				createdBy = lodash.get(reusable, 'createdBy.name');
				createdDate = commonUtils.formatDateForAuthorship(reusable.createdDate);
				modifiedBy = lodash.get(reusable, 'modifiedBy.name');
				modifiedDate = commonUtils.formatDateForAuthorship(reusable.modifiedDate);
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

	return commonUtils.build('reusables-manager', ReusableManager, view);
});
