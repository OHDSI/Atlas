define([
    'knockout',
    'atlas-state',
    'text!./characterization-view-edit.html',
    './characterization-design',
    './characterization-executions',
    './characterization-utils',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    './tabbed-grid',
    'less!./characterization-view-edit.less',
    'components/tabs',
], function (
    ko,
    sharedState,
    view,
    characterizationDesign,
    characterizationExecutions,
    characterizationUtils,
    config,
    authApi,
    Component,
    commonUtils,
) {
    class CharacterizationViewEdit extends Component {
        constructor(params) {
            super();

            this.canEdit = this.canSave = this.canDelete = ko.computed(function () {
                return true;
            });

            this.loading = ko.observable(false);

            this.tabs = {
                design: {
                    viewModel: new characterizationDesign.viewModel(params),
                    template: characterizationDesign.template
                },
                executions: {
                    viewModel: new characterizationExecutions.viewModel(params),
                    template: characterizationExecutions.template
                },
                utils: {
                    viewModel: new characterizationUtils.viewModel(params),
                    template: characterizationUtils.template
                },
            };
        }

        closeCharacterization() {
            commonUtils.routeTo('/cc/characterizations');
        }
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
