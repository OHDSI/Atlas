define([
    'knockout',
    'atlas-state',
    'text!./characterization-utils.html',
    'appConfig',
    'webapi/AuthAPI',
    'providers/Component',
    'utils/CommonUtils',
    './tabbed-grid',
    'less!./characterization-utils.less',
], function (
    ko,
    sharedState,
    view,
    config,
    authApi,
    Component,
    commonUtils,
) {
    class CharacterizationViewEditUtils extends Component {
        constructor(params) {
            super();

            this.loading = ko.observable(false);

            this.MODE_JSON = 0;
            this.MODE_R_CODE = 1;
            this.MODE_IMPORT = 2;

            this.mode = ko.observable(this.MODE_JSON);

            this.setMode = this.setMode.bind(this);

            this.expression = {
                featureAnalyses: [
                    {
                        type: "PRESET",
                        name: "Gender",
                        domain: "Demographics",
                        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
                        design: "useGender"
                    },
                    {
                        type: "CRITERIA",
                        name: "Age distribution",
                        domain: "Demographics",
                        description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
                        design: {
                            "Type": "ANY",
                            "CriteriaList": []
                        }
                    }
                ],
                parameters: [
                    {
                        name: "shortTermStartDays",
                        value: "15",
                    },
                    {
                        name: "mediumTermStartDays",
                        value: "30",
                    }
                ]
            }
        }

        setMode(mode) {
            this.mode(mode);
        }
    }

    return commonUtils.build('characterization-view-edit-utils', CharacterizationViewEditUtils, view);
});
