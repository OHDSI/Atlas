define([
    'knockout',
    'atlas-state',
    'text!./characterization-view-edit.html',
    './characterization-view-edit/characterization-design',
    './characterization-view-edit/characterization-executions',
    './characterization-view-edit/characterization-results',
    './characterization-view-edit/characterization-utils',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'less!./characterization-view-edit.less',
    'components/tabs',
    'faceted-datatable',
], function (
    ko,
    sharedState,
    view,
    characterizationDesign,
    characterizationExecutions,
    characterizationResults,
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

            this.selectedTab = ko.observable();
            this.componentParams = { characterizationId: params.characterizationId };

            switch (params.section) {
                case 'design':
                    this.selectedTab(0);
                    this.componentName = 'characterization-design';
                    break;
                case 'executions':
                    this.selectedTab(1);
                    this.componentName = 'characterization-view-edit-executions';
                    break;
                case 'results':
                    this.selectedTab(1);
                    this.componentName = 'characterization-view-edit-results';
                    this.componentParams = { ...this.componentParams, executionId: 0 };
                    break;
                case 'utils':
                    this.selectedTab(2);
                    this.componentName = 'characterization-view-edit-utils';
                    break;
                default:
                    commonUtils.routeTo('/cc/characterizations/' + params.id + '/design');
                    break;
            }

            this.selectTab = (index) => {
                commonUtils.routeTo('/cc/characterizations/' + params.characterizationId + '/' + ['design', 'executions', 'utils'][index]);
            }
        }

        closeCharacterization() {
            commonUtils.routeTo('/cc/characterizations');
        }
    }

    return commonUtils.build('characterization-view-edit', CharacterizationViewEdit, view);
});
