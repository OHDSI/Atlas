define([
    'knockout',
    'atlas-state',
    'text!./characterization-design.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'lodash',
    'pages/characterizations/components/feature-analyses/feature-analyses-browser',
    './characterization-params-create-modal',
    'components/cohort/linked-cohort-list',
    'components/linked-entity-list',
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

            this.showFeatureBrowser = this.showFeatureBrowser.bind(this);
            this.removeFeature = this.removeFeature.bind(this);
            this.showParameterCreateModal = this.showParameterCreateModal.bind(this);
            this.addParam = this.addParam.bind(this);
            this.removeParam = this.removeParam.bind(this);

            this.params = params;

            this.loading = ko.observable(false);

            this.cohorts = ko.computed({
                read: () => params.design().cohorts || [],
                write: (value) => params.design({
                    ...params.design(),
                    cohorts: value,
                }),
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
                data: ko.computed(() => params.design().featureAnalyses || [])
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

            this.showFeatureAnalysesBrowser = ko.observable(false);
            this.featureAnalysesSelected = ko.observable();
            this.featureAnalysesSelected.subscribe(feature => this.attachFeature(feature));

            this.isParameterCreateModalShown = ko.observable(false);
        }

        getRemoveCell(action, identifierField = 'id') {
            return (s, p, d) => {
                return `<a data-bind="click: () => $component.params.${action}('${d[identifierField]}')">Remove</a>`;
            }
        }

        showFeatureBrowser() {
            this.showFeatureAnalysesBrowser(true);
        }

        attachFeature({ id, name, description }) {
            const ccDesign = this.params.design();
            this.showFeatureAnalysesBrowser(false);
            this.params.design({
                ...ccDesign,
                featureAnalyses: lodash.uniqBy(
                    [
                        ...(ccDesign.featureAnalyses || []),
                        { id, name, description }
                    ],
                    'id'
                ),
            });
        }

        removeFeature(id) {
            const ccDesign = this.params.design();
            this.params.design({
                ...ccDesign,
                featureAnalyses: ccDesign.featureAnalyses.filter(a => a.id !== parseInt(id)),
            });
        }

        addParam({ name, value }) {
            const ccDesign = this.params.design();
            this.isParameterCreateModalShown(false);
            this.params.design({
                ...ccDesign,
                parameters: lodash.uniqBy(
                    [
                        ...(ccDesign.parameters || []),
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
