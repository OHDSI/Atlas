define(
  [
    'knockout',
    'text!./visit-util.html',
    './base-report',
    'modules/cohortdefinition/const',
    'modules/cohortdefinition/services/CohortResultsService',
    'components/visualizations/filter-panel/filter-panel',
    'modules/cohortdefinition/components/view/reporting/cost-utilization/table-baseline-exposure/table-baseline-exposure',
    'less!./visit-util.less',
    'components/visualizations/line-chart',
  ],
  function (ko, view, BaseCostUtilReport, costUtilConst, CohortResultsService) {

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

        const chartList = this.tableColumns.filter(item => item.showInChart);

        this.chartOptions = ko.observableArray(chartList.map(c => ({ label: c.title, value: c.title })));
        this.displayedCharts = ko.observableArray(this.chartOptions().map(o => o.value));

        this.setupChartsData(chartList);
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

      fetchAPI({ filters }) {
        return CohortResultsService.loadVisitUtilReport({
            source: this.source,
            cohortId: this.cohortId,
            window: this.window,
            visitStat: this.visitStat,
            filters,
          })
          .then(({ summary, data, visitConcepts, visitTypeConcepts }) => {

            Object.keys(summary).forEach(sKey => {
              if (typeof this.summary[sKey] === 'function') {
                this.summary[sKey](summary[sKey]);
              }
            });

            this.setupVisitConceptOptions(visitConcepts);
            this.setupVisitTypeConceptOptions(visitTypeConcepts);

            this.dataList(data);
          });
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
