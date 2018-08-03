define([
    'knockout',
    'atlas-state',
    'text!./characterization-design.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'lodash',
    'components/cohort-definition-browser',
    'pages/characterizations/components/feature-analyses/feature-analyses-browser',
    './characterization-params-create-modal',
    'less!./characterization-design.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    lodash
) {
    class CharacterizationDesign extends Component {
        constructor(params) {
            super();

            this.params = params;

            this.loading = ko.observable(false);

            this.cohortDefinitions = {
                newItemAction: this.showCohortBrowser,
                columns: [
                    {
                        title: 'ID',
                        data: 'id',
                        className: this.classes('col-cohort-id'),
                    },
                    {
                        title: 'Name',
                        data: 'name',
                        className: this.classes('col-cohort-name'),
                    },
                    {
                        title: 'Actions',
                        render: this.getRemoveCell('removeCohort'),
                        className: this.classes('col-cohort-remove'),
                    }
                ],
                data: ko.computed(() => params.design().cohorts || [])
            };

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
                        data: 'descr',
                        className: this.classes('col-feature-descr'),
                    },
                    {
                        title: 'Actions',
                        render: this.getRemoveCell('removeFeature'),
                        className: this.classes('col-feature-remove'),
                    }
                ],
                data: ko.computed(() => params.design().analyses || [])
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
                data: ko.computed(() => params.design().parameters || [])
            };

            this.showCohortDefinitionBrowser = ko.observable(false);
            this.cohortSelected = ko.observable();
            this.cohortSelected.subscribe(cohort => this.attachCohort(cohort));

            this.showFeatureAnalysesBrowser = ko.observable(false);
            this.featureAnalysesSelected = ko.observable();
            this.featureAnalysesSelected.subscribe(feature => this.attachFeature(feature));

            this.isParameterCreateModalShown = ko.observable(false);

            this.showCohortBrowser = this.showCohortBrowser.bind(this);
            this.showFeatureBrowser = this.showFeatureBrowser.bind(this);
            this.removeFeature = this.removeFeature.bind(this);
            this.showParameterCreateModal = this.showParameterCreateModal.bind(this);
            this.addParam = this.addParam.bind(this);
        }

        getRemoveCell(action, identifierField = 'id') {
            return (s, p, d) => {
                return `<a data-bind="click: () => $component.${action}('${d[identifierField]}')">Remove</a>`;
            }
        }

        showCohortBrowser() {
            this.showCohortDefinitionBrowser(true);
        }

        attachCohort({ id, name }) {
            const ccDesign = this.params.design();
            this.showCohortDefinitionBrowser(false);
            this.params.design({
                ...ccDesign,
                cohorts: lodash.uniqBy(
                    [
                        ...ccDesign.cohorts,
                        { id, name }
                    ],
                    'id'
                )
            });
        }

        removeCohort(id) {
            const ccDesign = this.params.design();
            this.params.design({
                ...ccDesign,
                cohorts: ccDesign.cohorts.filter(a => a.id !== parseInt(id)),
            });
        }

        showFeatureBrowser() {
            this.showFeatureAnalysesBrowser(true);
        }

        attachFeature({ id, name, description }) {
            const ccDesign = this.params.design();
            this.showFeatureAnalysesBrowser(false);
            this.params.design({
                ...ccDesign,
                analyses: lodash.uniqBy(
                    [
                        ...ccDesign.analyses,
                        { id, name, descr: description }
                    ],
                    'id'
                ),
            });
        }

        removeFeature(id) {
            const ccDesign = this.params.design();
            this.params.design({
                ...ccDesign,
                analyses: ccDesign.analyses.filter(a => a.id !== parseInt(id)),
            });
        }

        addParam({ name, value }) {
            const ccDesign = this.params.design();
            this.isParameterCreateModalShown(false);
            this.params.design({
                ...ccDesign,
                parameters: lodash.uniqBy(
                    [
                        ...ccDesign.parameters,
                        { name, value }
                    ],
                    'name'
                )
            });
        }

        removeParam(name) {
            const ccDesign = this.params.design();
            this.params.design({
                ...ccDesign,
                parameters: ccDesign.parameters.filter(a => a.name !== name),
            });
        }


        showParameterCreateModal() {
            this.isParameterCreateModalShown(true);
        }
    }

    return commonUtils.build('characterization-design', CharacterizationDesign, view);
});
