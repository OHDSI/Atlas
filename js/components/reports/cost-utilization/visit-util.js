define(
  [
    'knockout',
    'text!./visit-util.html',
    './base-report',
    'appConfig',
    'atlascharts',
    'd3',
    'd3-scale',
    'webapi/MomentAPI',
    'utils/BemHelper',
    'appConfig',
    'moment',
    './const',
    'bindings/lineChart',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/table-baseline-exposure/table-baseline-exposure',
    'less!./visit-util.less',
  ],
  function (ko, view, BaseCostUtilReport, appConfig, atlascharts, d3, d3scale, MomentAPI, BemHelper, config, moment, costUtilConst) {

    const componentName = 'cost-utilization-visit-util';

    const VISIT_CONCEPT = 'visitConcept';
    const VISIT_TYPE_CONCEPT = 'visitTypeConcept';

    class VisitUtilReport extends BaseCostUtilReport {

      constructor(params) {
        super(componentName, params);

        this.setupVisitConceptOptions = this.setupVisitConceptOptions.bind(this);
        this.setupVisitTypeConceptOptions = this.setupVisitTypeConceptOptions.bind(this);

        this.window = params.window;
        this.visitStat = params.visitStat;

        this.summary = {
          personsCount: ko.observable(),
          visitsCount: ko.observable(),
          visitsPer1000: ko.observable(),
          visitsPer1000WithVisits: ko.observable(),
          visitsPer1000PerYear: ko.observable(),
          lengthOfStayTotal: ko.observable(),
          lengthOfStayAvg: ko.observable(),
        };

        this.tableColumns = [
          {
            title: 'Period start',
            data: 'periodStart',
            className: this.classes('tbl-col', 'period-start'),
          },
          {
            title: 'Period end',
            data: 'periodEnd',
            className: this.classes('tbl-col', 'period-end'),
          },
          {
            title: 'Person Count',
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
          },
          {
            title: 'Percent Persons',
            data: 'personsPct',
            className: this.classes('tbl-col', 'persons-pct'),
            showInChart: true,
          },
          {
            title: 'Total Records',
            data: 'visitsCount',
            className: this.classes('tbl-col', 'records-total'),
            showInChart: true,
          },
          {
            title: 'Records per 1000',
            data: 'visitsPer1000',
            className: this.classes('tbl-col', 'records-per-1000'),
            showInChart: true,
          },
          {
            title: 'Records per 1,000 with record',
            data: 'visitsPer1000WithVisits',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
          },
          {
            title: 'Records per 1,000 Per Year',
            data: 'visitsPer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
          },
          {
            title: 'Total length of stay (in days)',
            data: 'lengthOfStayTotal',
            className: this.classes('tbl-col', 'total-length-stay'),
            showInChart: true,
          },
          {
            title: 'Average Length of Stay (in days)',
            data: 'lengthOfStayAvg',
            className: this.classes('tbl-col', 'total-length-avg'),
            showInChart: true,
          },
        ];

        this.setupChartsData(this.tableColumns.filter(item => item.showInChart));
        this.init();
      }

      getFilterList() {
        return [
          costUtilConst.getPeriodTypeFilter(),
          {
            type: 'select',
            label: 'Visit',
            name: VISIT_CONCEPT,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
          {
            type: 'select',
            label: 'Visit type',
            name: VISIT_TYPE_CONCEPT,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
        ];
      }

      setupVisitConceptOptions(conceptList) {
        const filter = this.filterList.find(filter => filter.name === VISIT_CONCEPT);
        filter.options([
          { label: 'All visits', value: null },
          ...VisitUtilReport.conceptsToOptions(conceptList)
        ]);
      }

      setupVisitTypeConceptOptions(conceptList) {
        const filter = this.filterList.find(filter => filter.name === VISIT_TYPE_CONCEPT);
        filter.options([
          { label: 'All visit types', value: null },
          ...VisitUtilReport.conceptsToOptions(conceptList)
        ]);
      }

      buildSearchUrl() {
        return `${appConfig.api.url}cohortresults/${this.source}/${this.cohortId}/healthcareutilization/visit/${this.window}/${this.visitStat}`;
      }

      onDataLoaded({ summary, data, visitConcepts, visitTypeConcepts }) {
        Object.keys(summary).forEach(sKey => {
          if (typeof this.summary[sKey] === 'function') {
            this.summary[sKey](summary[sKey]);
          }
        });

        this.setupVisitConceptOptions(visitConcepts);
        this.setupVisitTypeConceptOptions(visitTypeConcepts);

        this.dataList(data);
      }

      setupChartsData(lines) {
        this.chartDataList = ko.computed(() => lines.map(line => ({
          name: line.title,
          values: this.createChartDataObservable(line.data),
        })));
      }
    }

    const component = {
      viewModel: VisitUtilReport,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
