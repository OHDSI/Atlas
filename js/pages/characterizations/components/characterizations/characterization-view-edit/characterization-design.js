define([
    'knockout',
    'atlas-state',
    'text!./characterization-design.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'cohort-definition-browser',
    'less!./characterization-design.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
) {
    class CharacterizationDesign extends Component {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            this.cohortDefinitions = {
                title: 'Cohort definitions',
                descr: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
                newItemLabel: 'Import',
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
                    }
                ],
                data: [
                    {id: 1, name: 'First cohort'},
                    {id: 2, name: 'Second cohort'}
                ]
            };

            this.featureAnalyses = {
                title: 'Feature analyses',
                descr: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
                newItemLabel: 'Import',
                newItemAction: () => {},
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
                    }
                ],
                data: [
                    {id: 1, name: 'Gender', descr: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry'},
                    {id: 2, name: 'Age', descr: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry'}
                ]
            };

            this.featureAnalysesParams = {
                title: 'Feature analyses parameters',
                descr: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
                newItemLabel: 'New parameter',
                newItemAction: () => {},
                columns: [
                    {
                        title: 'Name',
                        data: 'name',
                        className: this.classes('tbl-col', 'param-name'),
                    },
                    {
                        title: 'Value',
                        data: 'value',
                        className: this.classes('tbl-col', 'param-value'),
                    }
                ],
                data: [
                    {name: 'mediumTermStartDays', value: '30'},
                    {name: 'shortTermStartDays', value: '15'}
                ]
            };

            this.showCohortDefinitionBrowser = ko.observable(false);
            this.cohortSelected = ko.observable();

            this.cohortSelected.subscribe(id => this.attachCohort(id));

            this.showCohortBrowser = this.showCohortBrowser.bind(this);
        }

        showCohortBrowser() {
            this.showCohortDefinitionBrowser(true);
        }

        attachCohort(id) {
            this.showCohortDefinitionBrowser(false);
            alert('Attached cohort ID = ' + id);
        }
    }

    return commonUtils.build('characterization-design', CharacterizationDesign, view);
});
