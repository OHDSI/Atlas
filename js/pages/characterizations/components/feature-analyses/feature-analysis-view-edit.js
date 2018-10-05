define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'pages/characterizations/services/PermissionService',
    'components/cohortbuilder/CriteriaGroup',
    'text!./feature-analysis-view-edit.html',
    'services/VocabularyService',
    'conceptsetbuilder/InputTypes/ConceptSet',
    'providers/Page',
	'pages/characterizations/const',
    'providers/AutoBind',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'less!./feature-analysis-view-edit.less',
    'components/cohortbuilder/components',
    'circe',
    'components/multi-select'
], function (
    ko,
    FeatureAnalysisService,
    PermissionService,
    CriteriaGroup,
    view,
    VocabularyService,
    ConceptSet,
    Page,
	constants,
    AutoBind,
    commonUtils,
    ohdsiUtil
) {

    const featureTypes = {
        PRESET: 'PRESET',
        CRITERIA_SET: 'CRITERIA_SET',
        CUSTOM_FE: 'CUSTOM_FE',
    };

    class FeatureAnalysisViewEdit extends AutoBind(Page) {
        constructor(params) {
            super(params);

            this.featureId = ko.observable();
            this.data = {
                name: ko.observable(),
                domain: ko.observable(),
                descr: ko.observable(),
                type: ko.observable(),
                design: ko.observable(),
            };
            this.domains = ko.observable([]);
            this.previousDesign = {};

            this.dataDirtyFlag = ko.observable({isDirty: () => false});
            this.loading = ko.observable(false);

            this.canEdit = this.isUpdatePermittedResolver();
            this.canSave = ko.computed(() => {
                return this.dataDirtyFlag().isDirty() && this.areRequiredFieldsFilled() && (this.featureId() === 0 ? this.isCreatePermitted() : this.canEdit());
            });
            this.canDelete = this.isDeletePermittedResolver();

            this.saveTooltipText = this.getSaveTooltipTextComputed();

            // Concept set import for criteria
            this.criteriaContext = ko.observable();
            this.showConceptSetBrowser = ko.observable();

            this.featureTypes = featureTypes;
            this.demoCustomSqlAnalysisDesign = constants.demoCustomSqlAnalysisDesign;
        }

        onPageCreated() {
            this.loadDomains();
            super.onPageCreated();
        }

        onRouterParamsChanged({ id }) {
            if (id !== undefined) {
                this.featureId(parseInt(id));
                if (this.featureId() === 0) {
                    this.setupAnalysisData({});
                } else {
                    this.loadDesign(this.featureId());
                }
            }
        }

        isCreatePermitted() {
            return PermissionService.isPermittedCreateFa();
        }

        isUpdatePermittedResolver() {
            return ko.computed(() => this.featureId() === 0 || PermissionService.isPermittedUpdateFa(this.featureId()));
        }

        isDeletePermittedResolver(id) {
            return ko.computed(() => PermissionService.isPermittedDeleteFa(this.featureId()));
        }

        areRequiredFieldsFilled() {
            const isDesignFilled = (typeof this.data.design() === 'string' || Array.isArray(this.data.design())) && this.data.design().length > 0;
            return typeof this.data.name() === 'string' && this.data.name().length > 0 && typeof this.data.type() === 'string' && this.data.type().length > 0 && isDesignFilled;
        }

        getSaveTooltipTextComputed() {
            return ko.computed(() => {
               if (!(this.featureId() === 0 ? this.isCreatePermitted() : this.canEdit())) {
                   return 'Not enough permissions';
               } else if (this.areRequiredFieldsFilled()) {
                   return 'No changes to persist';
               } else {
                   return 'Name and design should not be empty';
               }
            });
        }

        async loadDomains() {
            const domains = await FeatureAnalysisService.loadFeatureAnalysisDomains();
            this.domains(domains.map(d => ({ label: d.name, value: d.id })));
        }

        async loadDesign(id) {
            this.loading(true);

            const featureAnalysis = await FeatureAnalysisService.loadFeatureAnalysis(id);
            this.setupAnalysisData(featureAnalysis);

            this.loading(false);
        }

        setupAnalysisData({ name = '', descr = '', domain = '', type = '', design= '' }) {
            let parsedDesign;
            if (type === this.featureTypes.CRITERIA_SET) {
                parsedDesign = design.map(c => {
                    const cs = ko.observable(c.conceptSets.map(set => ({ ...set, name: ko.observable(set.name) })));
                    return {
                        id: c.id,
                        name: ko.observable(c.name),
                        conceptSets: cs,
                        expression: ko.observable(new CriteriaGroup(c.expression, cs)),
                    }
                });
            } else {
                parsedDesign = design;
            }

            this.data.name(name);
            this.data.descr(descr);
            this.data.domain(domain);
            this.data.type(type);
            this.data.design(parsedDesign);
            this.dataDirtyFlag(new ohdsiUtil.dirtyFlag(this.data));
            this.previousDesign = { [type]: parsedDesign };
        }

        setType(type) {
            let prevType = this.data.type();
            let prevDesign = this.data.design();

            if (type === this.featureTypes.CRITERIA_SET) {
                let newDesign = this.previousDesign[type] || [this.getEmptyCriteriaFeatureDesign()];
                this.data.design(newDesign);
            } else {
                let newDesign = this.previousDesign[type] || null;
                this.data.design(newDesign);
            }
            this.data.type(type);

            this.previousDesign[prevType] = prevDesign;
        }

        getEmptyCriteriaFeatureDesign() {
            const conceptSets = ko.observable([]);
            return {
                name: ko.observable(''),
                conceptSets,
                expression: ko.observable(new CriteriaGroup(null, conceptSets)),
            };
        }

        addCriteria() {
            this.data.design([...this.data.design(), this.getEmptyCriteriaFeatureDesign()]);
        }

        removeCriteria(index) {
            const criteriaList = this.data.design();
            criteriaList.splice(index, 1);
            this.data.design(criteriaList);
        }

        handleConceptSetImport(criteriaIdx, item) {
            this.criteriaContext({...item, criteriaIdx});
            this.showConceptSetBrowser(true);
        }

        onRespositoryConceptSetSelected(conceptSet, source) {
            const context = this.criteriaContext();
            const featureCriteria = this.data.design()[context.criteriaIdx];

            VocabularyService.getConceptSetExpression(conceptSet.id, source.url).done((result) => {
                const newId = featureCriteria.conceptSets().length > 0 ? Math.max(...featureCriteria.conceptSets().map(c => c.id)) + 1 : 0;
                const newConceptSet = new ConceptSet({
                    id: newId,
                    name: conceptSet.name,
                    expression: result
                });
                featureCriteria.conceptSets([...featureCriteria.conceptSets(), newConceptSet]);
                context.conceptSetId(newConceptSet.id);

                this.showConceptSetBrowser(false);
            });
        }

        handleEditConceptSet() {

        }

        async save() {
            console.log('Saving: ', JSON.parse(ko.toJSON(this.data)));

            if (this.featureId() < 1) {
                const res = await FeatureAnalysisService.createFeatureAnalysis(this.data);
                commonUtils.routeTo('/cc/feature-analyses/' + res.id);
            } else {
                const res = await FeatureAnalysisService.updateFeatureAnalysis(this.featureId(), this.data);
                this.setupAnalysisData(res);
                this.loading(false);
            }
        }

        deleteFeature() {
            commonUtils.confirmAndDelete({
                loading: this.loading,
                remove: () => FeatureAnalysisService.deleteFeatureAnalysis(this.featureId()),
                redirect: this.closeAnalysis
            });
        }

        closeAnalysis() {
            commonUtils.routeTo('/cc/feature-analyses');
        }
    }

    return commonUtils.build('feature-analysis-view-edit', FeatureAnalysisViewEdit, view);
});
