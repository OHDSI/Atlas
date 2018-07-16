define([
    'knockout',
    'atlas-state',
    'text!./tabbed-grid.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    'pages/characterizations/const',
    'databindings',
    'less!./tabbed-grid.less',
    'components/heading',
    'faceted-datatable'
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
    constants,
) {
    class CharacterizationsTabbedGrid extends Component {
        constructor(params) {
            super();
            this.isAuthenticated = authApi.isAuthenticated;

            this.tabs = constants.gridTabs;
            this.activeTab = params.activeTab;

            this.data = params.data;
            this.gridColumns = params.gridColumns;
            this.gridOptions = params.gridOptions;

            this.createNew = params.createNew;
            this.createNewLabel = constants.gridTabs.filter(t => t.value === params.activeTab).newEntityLabel;
        }
    }

    return commonUtils.build('characterizations-tabbed-grid', CharacterizationsTabbedGrid, view);
});
