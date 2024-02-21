define([
    "knockout",
    "text!./explore-temporal.html",
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'components/tabs',
    './temporal/annual',
    './temporal/temporal',
    "less!./explore-temporal.less",
  ],
  function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    tabs,
  ) {

    class ExploreTemporal extends AutoBind(Component) {
      constructor(params) {
        super(params);
        this.selectedTabKey = ko.observable('annual');
        const temporal = params.temporal || {};
        this.temporalAnnual = temporal.temporalAnnual || [];
        this.temporalDaily = temporal.temporal || [];
        this.tabs = [
          {
            title: 'Annual',
            key: 'annual',
            componentName: 'explore-temporal-annual',
            componentParams: {data: this.temporalAnnual},
            visible: () => this.temporalAnnual && this.temporalAnnual.length > 0,
          },
          {
            title: 'Daily',
            key: 'daily',
            componentName: 'explore-temporal-daily',
            componentParams: {data: this.temporalDaily},
            visible: () => this.temporalDaily && this.temporalDaily.length > 0,
          },
        ].filter(v => v.visible());
      }

    }

    commonUtils.build('explore-temporal', ExploreTemporal, view);
  }
);