define([
    'knockout',
    'pages/characterizations/services/FeatureAnalysisService',
    'components/cohortbuilder/CriteriaGroup',
    'text!./feature-analysis-view-edit.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Vocabulary',
    'conceptsetbuilder/InputTypes/ConceptSet',
    'providers/Component',
    'utils/CommonUtils',
    'assets/ohdsi.util',
    'less!./feature-analysis-view-edit.less',
    'components/cohortbuilder/components',
    'modules/circe/main',
    'components/multi-select'
], function (
    ko,
    FeatureAnalysisService,
    CriteriaGroup,
    view,
    config,
    authApi,
    VocabularyAPI,
    ConceptSet,
    Component,
    commonUtils,
    ohdsiUtil
) {

    const featureTypes = {
        PRESET: 'PRESET',
        CRITERIA_SET: 'CRITERIA_SET',
        CUSTOM_FE: 'CUSTOM_FE',
    };

    class FeatureAnalysisViewEdit extends Component {
        constructor(params) {
            super();

            this.setType = this.setType.bind(this);
            this.save = this.save.bind(this);
            this.handleConceptSetImport = this.handleConceptSetImport.bind(this);
            this.onRespositoryConceptSetSelected = this.onRespositoryConceptSetSelected.bind(this);

            this.data = {
                name: ko.observable(),
                domain: ko.observable(),
                descr: ko.observable(),
                type: ko.observable(),
                design: ko.observable(),
            };
            this.domains = ko.observable([]);

            this.dataDirtyFlag = ko.observable({isDirty: () => false});
            this.loading = ko.observable(false);
            this.canSave = ko.computed(() => {
                return this.dataDirtyFlag().isDirty();
            });
            this.canEdit = this.canDelete = ko.computed(function () {
                return true;
            });

            // Concept set import for criteria
            this.criteriaContext = ko.observable();
            this.showConceptSetBrowser = ko.observable();

            this.featureTypes = featureTypes;

            this.loadData();
        }

        loadData() {
            this.loading(true);
            Promise.all([
                FeatureAnalysisService.loadFeatureAnalysis(),
                FeatureAnalysisService.loadFeatureAnalysisDomains()
            ]).then(([featureAnalysis, domains]) => {

                this.domains(domains);

                this.data.name(featureAnalysis.name);
                this.data.descr(featureAnalysis.descr);
                this.data.domain(featureAnalysis.domain);
                this.data.type(featureAnalysis.type);

                if (featureAnalysis.type === this.featureTypes.CRITERIA_SET) {
                    this.data.design(
                        featureAnalysis.design.map(c => {
                            return {
                                name: ko.observable(c.name),
                                conceptSets: ko.observable(c.conceptSets),
                                expression: ko.observable(new CriteriaGroup(c.expression, c.conceptSets)),
                            }
                        })
                    );
                } else {
                    this.data.design(featureAnalysis.design);
                }

                this.dataDirtyFlag(new ohdsiUtil.dirtyFlag(this.data));

                this.loading(false);
            });
        }

        setType(type) {
            if (type === this.featureTypes.CRITERIA_SET) {
                this.data.design([this.getEmptyCriteriaFeatureDesign()]);
            } else {
                this.data.design('');
            }
            this.data.type(type);
        }

        getEmptyCriteriaFeatureDesign() {
            const conceptSets = ko.observable([]);
            return {
                name: ko.observable(''),
                conceptSets,
                expression: ko.observable(new CriteriaGroup(null, conceptSets)),
            };
        }

        addCriteriaFeature() {
            this.data.design([...this.data.design(), this.getEmptyCriteriaFeatureDesign()]);
        }

        handleConceptSetImport(criteriaIdx, item) {
            this.criteriaContext({...item, criteriaIdx});
            this.showConceptSetBrowser(true);
        }

        onRespositoryConceptSetSelected(conceptSet, source) {
            const context = this.criteriaContext();
            const featureCriteria = this.data.design()[context.criteriaIdx];

            VocabularyAPI.getConceptSetExpression(conceptSet.id, source.url).done((result) => {
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

        save() {
            console.log('Saving: ', JSON.parse(ko.toJSON(this.data)));
        }

        closeAnalysis() {
            commonUtils.routeTo('/cc/feature-analyses');
        }
    }

    return commonUtils.build('feature-analysis-view-edit', FeatureAnalysisViewEdit, view);
});
