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
    'components/conceptset/InputTypes/ConceptSet',
    'services/Vocabulary',
    'lodash',
    'components/conceptset/utils',
    'const',
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
    conceptSetUtils,
    globalConstants
) {
    class CharacterizationDesign extends AutoBind(Component) {
        constructor(params) {
            super();

            this.design = params.design;
            this.characterizationId = params.characterizationId;
            this.areStratasNamesEmpty = params.areStratasNamesEmpty;
            this.duplicatedStrataNames = params.duplicatedStrataNames;
            this.loadConceptSet = params.loadConceptSet;

            this.loading = ko.observable(false);

            this.isViewPermitted = this.isPermittedViewResolver();
            this.isEditPermitted = params.isEditPermitted;

            this.cohorts = ko.pureComputed({
                read: () => params.design() && params.design().cohorts() || [],
                write: (value) => params.design().cohorts(value),
            });

            this.strataConceptSets = ko.pureComputed({
                read: () => params.design() && params.design().strataConceptSets || [],
                write: (value) => params.design() && params.design().strataConceptSets(value)
            });

            this.stratas = ko.pureComputed({
                read: () => params.design() && params.design().stratas() || [],
                write: (value) => params.design().stratas(value),
            });

            this.featureAnalyses = {
                newItemAction: this.showFeatureBrowser,
                columns: globalConstants.getLinkedFeatureAnalysisColumns(this),
                data: ko.pureComputed(() => params.design() && params.design().featureAnalyses() || [])
            };

            this.featureAnalysesParams = {
                newItemAction: this.showParameterCreateModal,
                columns: globalConstants.getLinkedFeAParametersColumns(this),
                data: ko.pureComputed(() => params.design() && params.design().parameters() || [])
            };

            this.showFeatureAnalysesBrowser = ko.observable(false);

            this.isParameterCreateModalShown = ko.observable(false);
            this.showConceptSetBrowser = ko.observable(false);
            this.criteriaContext = ko.observable();
            this.tableOptions = commonUtils.getTableOptions('M');
        }

        checkStrataNames(data, event) {
            this.areStratasNamesEmpty(this.stratas().find(s => s.name() === ''));
            this.duplicatedStrataNames(Object.entries(lodash.groupBy(this.stratas().map(s => s.name()))).filter(entry => entry[1].length > 1).map(entry => entry[0]));
        }

        isStrataDuplicated(strataName) {
            return !!this.duplicatedStrataNames().find(s => s === strataName);
        }

        isPermittedViewResolver() {
            return ko.pureComputed(
                () => (this.characterizationId() ? PermissionService.isPermittedGetCC(this.characterizationId()) : true)
            );
        }

        getRemoveCell(action, identifierField = 'id') {
            return (s, p, d) => {
                return `<a href='#' data-bind="click: () => $component.params.${action}('${d[identifierField]}'), text: ko.i18n('cc.viewEdit.design.fa.actions.remove', 'Remove')">Remove</a>`;
            }
        }

        showFeatureBrowser() {
            this.showFeatureAnalysesBrowser(true);
        }

        closeFeatureBrowser() {
            this.showFeatureAnalysesBrowser(false);
        }

        onSelect(data = []) {
            this.closeFeatureBrowser();
            const ccDesign = this.design();
            const featureAnalyses = data.map(item => lodash.pick(item, ['id', 'name', 'description']));
            ccDesign.featureAnalyses(featureAnalyses);
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
              name: ko.observable(ko.i18n('cc.viewEdit.design.subgroups.newSubgroup', 'New Subgroup')()),
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

        handleConceptSetImport(item, context, event) {
            this.criteriaContext(item);
            this.showConceptSetBrowser(true);
        }
			
        handleEditConceptSet(item, context) {
          if (item.conceptSetId() == null) {
            return;
          }
          this.loadConceptSet(item.conceptSetId());
        }	

        onRespositoryConceptSetSelected(conceptSet, source) {
            conceptSetUtils.conceptSetSelectionHandler(this.strataConceptSets(), this.criteriaContext(), conceptSet, source)
                .done(() => this.showConceptSetBrowser(false));
        }
      
        onRespositoryActionComplete(result) {
            this.showConceptSetBrowser(false);
            if (result.action === 'add') {
                const newId = conceptSetUtils.newConceptSetHandler(this.strataConceptSets(), this.criteriaContext());
                this.loadConceptSet(newId)
            }

            this.criteriaContext(null);
        }

    }

    return commonUtils.build('characterization-design', CharacterizationDesign, view);
});
