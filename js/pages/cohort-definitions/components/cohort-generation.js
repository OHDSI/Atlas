define([
    'knockout',
    'const',
    'components/Component',
    'utils/CommonUtils',
    'text!./cohort-generation.html',
    'less!./cohort-generation.less'
], function (
    ko,
    globalConstants,
    Component,
    commonUtils,
    view
) {

    class CohortGeneration extends Component {
        constructor(params) {
            super();

            this.cohortDefinitionSourceInfo = ko.observableArray();
            this.showOnlySourcesWithResults = ko.observable(false);
            this.sourcesColumn = [{
                data: 'sourceName'
            }];
        }
    }

    return commonUtils.build('cohort-generation', CohortGeneration, view);
});
