define([
    "knockout",
    "text!./temporal.html",
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'numeral',
    '../utils',
    "less!./temporal.less",
  ],
  function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    numeral,
    utils,
  ) {

    class ExploreTemporal extends AutoBind(Component) {
      constructor(params) {
        super(params);
        this.tableColumns = [
          {
            title: 'Start day',
            data: 'startDay',
            class: this.classes('col-start-day'),
          },
          {
            title: 'End day',
            data: 'endDay',
            class: this.classes('col-end-day'),
          },
          {
            title: 'Count',
            class: this.classes('col-count'),
            render: (s, p, d) => numeral(d.count || 0).format(),
          },
          {
            title: 'Pct',
            class: this.classes('col-pct'),
            render: (s, p, d) => {
              const pct = utils.formatPct((d.avg * 100) || 0);
              return `<div class="pct-fill" style="width: ${pct}"><div>${pct}</div></div>`;
            },
          },
        ];
        this.tableOptions = {...commonUtils.getTableOptions('M'), pageLength: 10};

        this.temporal = params.data || [];
        this.data = ko.observableArray(this.temporal);
      }

    }

    commonUtils.build('explore-temporal-daily', ExploreTemporal, view);
  }
);