define([
	'knockout',
	'text!./manager.html',
	'../PathwayService',
	'../PermissionService',
	'../PathwayAnalysis',
	'atlas-state',
	'appConfig',
	'services/AuthAPI',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'assets/ohdsi.util',
	'const',
	'less!./manager.less',
	'components/tabs',
	'./tabs/pathway-design',
	'./tabs/pathway-exec-wrapper',
	'./tabs/pathway-results',
	'./tabs/pathway-utils',
	'faceted-datatable'
], function (
	ko,
	view,
	PathwayService,
	PermissionService,
	PathwayAnalysis,
	sharedState,
	config,
	authApi,
	Page,
	AutoBind,
	commonUtils,
	ohdsiUtil,
	constants,
) {
	class PathwaysManager extends AutoBind(Page) {
		constructor(params) {
			super(params);

			this.design = sharedState.CohortPathways.current;
			this.dirtyFlag = sharedState.CohortPathways.dirtyFlag;
			this.analysisId = ko.observable();
			this.executionId = ko.observable();
			this.loading = ko.observable(false);
			this.defaultName = constants.newEntityNames.pathway;

			this.isNameFilled = ko.computed(() => {
				return this.design() && this.design().name();
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.design().name() !== this.defaultName;
			});

			this.canEdit = this.isEditPermittedResolver();
			this.canSave = this.isSavePermittedResolver();
			this.canDelete = this.isDeletePermittedResolver();
			this.isNewEntity = this.isNewEntityResolver();
			this.canCopy = this.canCopyResolver();

			this.selectedTabKey = ko.observable("design");
			this.componentParams = {
				design: this.design,
				analysisId: this.analysisId,
				executionId: this.executionId,
				dirtyFlag: this.dirtyFlag,
			};
			this.pathwayCaption = ko.computed(() => {
				if (this.design() && this.design().id !== undefined && this.design().id !== 0) {
					return 'Cohort Pathway #' + this.design().id;
				}
				return this.defaultName;
			});
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});
		}

		onRouterParamsChanged({analysisId, section, subId}) {
			if (analysisId !== undefined) {
				this.analysisId(parseInt(analysisId));
				this.load(this.analysisId() || 0);
			}
			this.setupSection(section);
			this.executionId(subId);
		}

		selectTab(index, { key }) {
			commonUtils.routeTo(commonUtils.getPathwaysUrl(this.componentParams.analysisId(), key));
		}

		setupDesign(design) {
			this.design(design);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.design()));
		}

		setupSection(section) {
				const tabKey = section === 'results' ? 'executions' : section;
				this.selectedTabKey(tabKey || 'design');
		}

		isEditPermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedUpdate(this.analysisId()) : PermissionService.isPermittedCreate())
				);
		}

		isSavePermittedResolver() {
				return ko.computed(() => this.canEdit() && this.dirtyFlag().isDirty() && this.isNameCorrect())
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

		async load(id) {
			if (this.design() && (this.design().id === id || 0 == id)) return; // this design is already loaded.

			if(this.dirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?"))
				return;

			if (id < 1) {
				this.setupDesign(new PathwayAnalysis());
			} else {
				const analysis = await PathwayService.load(id);
				this.setupDesign(new PathwayAnalysis(analysis));
				this.loading(false);
			}
		}

		async save() {
			this.isSaving(true);

			// Next check to see that a cohort pathway with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current cohort pathway is excluded in this check.
			try {
				const results = await PathwayService.exists(this.design().name(), this.design().id === undefined ? 0 : this.design().id);
				if (results > 0) {
					alert('A cohort pathway with this name already exists. Please choose a different name.');
				} else {
					if (!this.design().id) {
						const newAnalysis = await PathwayService.create(this.design());
						this.dirtyFlag().reset();
						commonUtils.routeTo(commonUtils.getPathwaysUrl(newAnalysis.id, 'design'));
					} else {
						const updatedAnalysis = await PathwayService.save(this.design().id, this.design());
						this.setupDesign(new PathwayAnalysis(updatedAnalysis));
					}
				}
			} catch (e) {
				alert('An error occurred while attempting to save a cohort pathway.');
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		async copyPathway() {
			this.isCopying(true);
			const copiedAnalysis = await PathwayService.copy(this.design().id);
			this.setupDesign(new PathwayAnalysis(copiedAnalysis));
			this.isCopying(false);
			commonUtils.routeTo(commonUtils.getPathwaysUrl(copiedAnalysis.id, 'design'));
		}

		async del() {
			if (confirm('Are you sure?')) {
				this.isDeleting(true);
				this.loading(true);
				await PathwayService.del(this.design().id);
				this.dirtyFlag().reset();
				this.loading(false);
				this.close();
			}
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm("Your changes are not saved. Would you like to continue?")) {
				return;
			}
			this.design(null);
			this.dirtyFlag().reset();

			commonUtils.routeTo('/pathways');
		}

	}

	return commonUtils.build('pathways-manager', PathwaysManager, view);
});
