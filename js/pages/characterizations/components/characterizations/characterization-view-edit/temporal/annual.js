define([
    "knockout",
    "text!./annual.html",
    'components/Component',
    'utils/CommonUtils',
    'utils/AutoBind',
    'numeral',
    '../utils',
    'utils/ChartUtils',
    'd3',
    'atlascharts',
    'components/charts/histogram',
    "less!./annual.less",
  ],
  function (
    ko,
    view,
    Component,
    commonUtils,
    AutoBind,
    numeral,
    utils,
    ChartUtils,
    d3,
    atlascharts,
  ) {

    class ExploreTemporalAnnual extends AutoBind(Component) {
      constructor(params) {
        super(params);
        this.tableColumns = [
          {
            title: 'Year',
            data: 'year',
            class: this.classes('col-year'),
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

    commonUtils.build('explore-temporal-annual', ExploreTemporalAnnual, view);
  }
);