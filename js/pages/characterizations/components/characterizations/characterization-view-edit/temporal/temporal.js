define([
    "knockout",
    "text!./temporal.html",
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'numeral',
    "less!./temporal.less",
  ],
  function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    numeral,
  ) {

    class ExploreTemporal extends AutoBind(Component) {
      constructor(params) {
        super(params);
        this.tableColumns = [
          {
            title: 'Start day',
            data: 'startDay',
            class: 'col-start-day',
          },
          {
            title: 'End day',
            data: 'endDay',
            class: 'col-end-day',
          },
          {
            title: 'Count',
            class: 'col-count',
            render: (s, p, d) => numeral(d.count || 0).format(),
          },
          {
            title: 'Pct',
            data: 'avg',
            class: 'col-pct',
          },
        ];
        this.tableOptions = {...commonUtils.getTableOptions('M'), pageLength: 10};

        this.temporal = params.temporal || [];
        this.data = ko.observableArray(this.temporal);
      }

    }

    commonUtils.build('explore-temporal-daily', ExploreTemporal, view);
  }
);