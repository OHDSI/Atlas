define([
    "knockout",
    "utils/CommonUtils",
    "components/Component",
    "utils/AutoBind",
    "text!./explore-temporal-cohort.html",
    "less!./explore-temporal-cohort.less",
    'components/tabs',
    './explore-temporal',
], function (ko, commonUtils, Component, AutoBind, view, tabs) {

    class ExploreTemporalCohort extends AutoBind(Component) {
        constructor(params) {
            super(params);
            const temporal = params.temporal || {};
            this.temporalDataByCohort = temporal.temporalDataByCohort || {};

            this.tabs = this.temporalDataByCohort.map(cohort => ({
                title: cohort.cohortName,
                key: cohort.cohortName,
                componentParams: { data: cohort.temporalInfo },
            }));
            this.selectedTabKey = ko.observable(this.tabs.length > 0 ? this.tabs[0].key : null);
        }
    }

    commonUtils.build('explore-temporal-cohort', ExploreTemporalCohort, view);
});