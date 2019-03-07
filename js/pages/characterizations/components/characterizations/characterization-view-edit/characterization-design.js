define([
    'knockout',
    'atlas-state',
    'pages/characterizations/services/PermissionService',
    'text!./characterization-design.html',
    'appConfig',
    'services/AuthAPI',
    'components/Component',
    'utils/AutoBind',
    'utils/CommonUtils',
    'components/cohortbuilder/CriteriaGroup',
    'conceptsetbuilder/InputTypes/ConceptSet',
    'services/Vocabulary',
    'lodash',
    '../../../utils',
    'pages/characterizations/components/feature-analyses/feature-analyses-browser',
    './characterization-params-create-modal',
    'components/cohort/linked-cohort-list',
    'components/linked-entity-list',
    'less!./characterization-design.less',
    'components/cohortbuilder/components',
    'circe',
    'components/ac-access-denied',
], function (
    ko,
    sharedState,
    PermissionService,
    view,
    config,
    authApi,
    Component,
    AutoBind,
    commonUtils,
    CriteriaGroup,
    ConceptSet,
    VocabularyAPI,
    lodash,
    utils,
) {
    class CharacterizationDesign extends AutoBind(Component) {
        constructor(params) {
            super();

            this.design = params.design;
            this.characterizationId = params.characterizationId;
            this.areStratasNamesEmpty = params.areStratasNamesEmpty;
            this.duplicatedStrataNames = params.duplicatedStrataNames;

            this.loading = ko.observable(false);

            this.isViewPermitted = this.isPermittedViewResolver();

            this.cohorts = ko.computed({
                read: () => params.design() && params.design().cohorts() || [],
                write: (value) => params.design().cohorts(value),
            });

            this.strataConceptSets = ko.pureComputed({
                read: () => params.design().strataConceptSets,
                write: (value) => params.design().strataConceptSets(value)
            });

            this.stratas = ko.computed({
                read: () => params.design() && params.design().stratas() || [],
                write: (value) => params.design().stratas(value),
            });

            this.featureAnalyses = {
                newItemAction: this.showFeatureBrowser,
                columns: [
                    {
                        title: 'ID',
                        data: 'id',
                        className: this.classes('col-feature-id'),
                    },
                    {
                        title: 'Name',
                        data: 'name',
                        className: this.classes('col-feature-name'),
                    },
                    {
                        title: 'Description',
                        data: 'description',
                        className: this.classes('col-feature-descr'),
                    },
                    {
                        title: 'Actions',
                        render: this.getRemoveCell('removeFeature'),
                        className: this.classes('col-feature-remove'),
                    }
                ],
                data: ko.computed(() => params.design() && params.design().featureAnalyses() || [])
            };

            this.featureAnalysesParams = {
                newItemAction: this.showParameterCreateModal,
                columns: [
                    {
                        title: 'Name',
                        data: 'name',
                        className: this.classes('col-param-name'),
                    },
                    {
                        title: 'Value',
                        data: 'value',
                        className: this.classes('col-param-value'),
                    },
                    {
                        title: 'Actions',
                        render: this.getRemoveCell('removeParam', 'name'),
                        className: this.classes('col-param-remove'),
                    }
                ],
                data: ko.computed(() => params.design() && params.design().parameters() || [])
            };

            this.showFeatureAnalysesBrowser = ko.observable(false);
            this.featureAnalysesSelected = ko.observableArray();
            this.featureAnalysesAvailable = ko.pureComputed(() => this.featureAnalysesSelected().length > 0);

            this.isParameterCreateModalShown = ko.observable(false);
            this.showConceptSetBrowser = ko.observable(false);
            this.criteriaContext = ko.observable();
        }

        checkStrataNames(data, event) {
            this.areStratasNamesEmpty(this.stratas().find(s => s.name() === ''));
            this.duplicatedStrataNames(Object.entries(lodash.groupBy(this.stratas().map(s => s.name()))).filter(entry => entry[1].length > 1).map(entry => entry[0]));
        }

        isStrataDuplicated(strataName) {
            return !!this.duplicatedStrataNames().find(s => s === strataName);
        }

        isPermittedViewResolver() {
            return ko.computed(
                () => (this.characterizationId() ? PermissionService.isPermittedGetCC(this.characterizationId()) : true)
            );
        }

        getRemoveCell(action, identifierField = 'id') {
            return (s, p, d) => {
                return `<a href='#' data-bind="click: () => $component.params.${action}('${d[identifierField]}')">Remove</a>`;
            }
        }

        showFeatureBrowser() {
            this.showFeatureAnalysesBrowser(true);
        }

        closeFeatureBrowser() {
            this.showFeatureAnalysesBrowser(false);
        }

        importFeatures() {
            this.closeFeatureBrowser();
            this.featureAnalysesSelected().forEach(fe => this.attachFeature(fe));
        }

        attachFeature({ id, name, description }) {
            const ccDesign = this.design();
            this.showFeatureAnalysesBrowser(false);
            ccDesign.featureAnalyses(lodash.uniqBy(
                    [
                        ...(ccDesign.featureAnalyses() || []),
                        { id, name, description }
                    ],
                    'id'
                )
            );
        }

        removeFeature(id) {
            this.design().featureAnalyses.remove(a => a.id === parseInt(id));
        }

        addParam({ name, value }) {
            const ccDesign = this.design();
            this.isParameterCreateModalShown(false);
            this.design().parameters(lodash.uniqBy(
                    [
                        ...(ccDesign.parameters() || []),
                        { name, value }
                    ],
                    'name'
                )
            );
        }

        removeParam(name) {
            this.design().parameters.remove(a => a.name === name);
        }

        addStrata() {
            const strata = {
              name: ko.observable('New Subgroup'),
              criteria: ko.observable(new CriteriaGroup(null, this.strataConceptSets))
            };
            const ccDesign = this.design();
            ccDesign.stratas([
                ...(ccDesign.stratas() || []),
                strata
            ]);
            this.checkStrataNames();
        }

        removeStrata(index) {
            const strataToRemove = this.design().stratas()[index];
            this.design().stratas.remove(strataToRemove);
        }

        showParameterCreateModal() {
            this.isParameterCreateModalShown(true);
        }

        handleConceptSetImport(criteriaIdx, item) {
          console.log('import', item);
          this.criteriaContext({...item, criteriaIdx});
          this.showConceptSetBrowser(true);
        }

        onRespositoryConceptSetSelected(conceptSet, source) {
            utils.conceptSetSelectionHandler(this.strataConceptSets(), this.criteriaContext(), conceptSet, source)
                .done(() => this.showConceptSetBrowser(false));
        }
    }

    return commonUtils.build('characterization-design', CharacterizationDesign, view);
});
