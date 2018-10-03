define([
	'knockout',
	'text!./manager.html',
	'../services/PathwayService',
	'../services/PermissionService',
	'../PathwayAnalysis',
	'atlas-state',
	'appConfig',
	'webapi/AuthAPI',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'assets/ohdsi.util',
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
	ohdsiUtil
) {
	class PathwaysManager extends AutoBind(Page) {
		constructor(params) {
			super(params);

			this.design = sharedState.CohortPathways.current;
			this.dirtyFlag = sharedState.CohortPathways.dirtyFlag;
			this.analysisId = ko.observable();
			this.executionId = ko.observable();

			this.loading = ko.observable(false);
			this.canEdit = this.isEditPermittedResolver();
			this.canSave = this.isSavePermittedResolver();
			this.canDelete = this.isDeletePermittedResolver();

			this.selectedTabKey = ko.observable("design");
			this.componentParams = {
				design: this.design,
				analysisId: this.analysisId,
				executionId: this.executionId,
			};

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
				return ko.computed(() => this.canEdit() && this.dirtyFlag().isDirty())
		}

		isDeletePermittedResolver() {
				return ko.computed(
						() => (this.analysisId() ? PermissionService.isPermittedDelete(this.analysisId()) : false)
				);
		}
		

		async load(id) {
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
			if (!this.design().id) {
				const newAnalysis = await PathwayService.create(this.design());
				this.dirtyFlag().reset();
				commonUtils.routeTo(commonUtils.getPathwaysUrl(newAnalysis.id, 'design'));
			} else {
				const updatedAnalysis = await PathwayService.save(this.design().id, this.design());
				this.setupDesign(new PathwayAnalysis(updatedAnalysis));
				this.loading(false);
			}
		}

		async del() {
			if (confirm('Are you sure?')) {
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
