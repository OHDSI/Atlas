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
          personsPct: ko.observable(),
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
            title: 'Persons',
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Persons %',
            data: 'personsPct',
            className: this.classes('tbl-col', 'persons-pct'),
            showInChart: true,
            render: BaseCostUtilReport.formatPercents,
            yFormat: BaseCostUtilReport.formatPercents,
          },
          {
            title: 'Records',
            data: 'visitsCount',
            className: this.classes('tbl-col', 'records-total'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records/1K',
            data: 'visitsPer1000',
            className: this.classes('tbl-col', 'records-per-1000'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records/1K +record',
            data: 'visitsPer1000WithVisits',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Records/1K/Year',
            data: 'visitsPer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Days of Stay',
            data: 'lengthOfStayTotal',
            className: this.classes('tbl-col', 'total-length-stay'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: 'Avg. Days of Stay',
            data: 'lengthOfStayAvg',
            className: this.classes('tbl-col', 'total-length-avg'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
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
            this.summary.personsCount(BaseCostUtilReport.formatFullNumber(summary.personsCount));
            this.summary.personsPct(BaseCostUtilReport.formatPercents(summary.personsPct));
            this.summary.visitsCount(BaseCostUtilReport.formatFullNumber(summary.visitsCount));
            this.summary.visitsPer1000(BaseCostUtilReport.formatFullNumber(summary.visitsPer1000));
            this.summary.visitsPer1000WithVisits(BaseCostUtilReport.formatFullNumber(summary.visitsPer1000WithVisits));
            this.summary.visitsPer1000PerYear(BaseCostUtilReport.formatFullNumber(summary.visitsPer1000PerYear));
            this.summary.lengthOfStayTotal(BaseCostUtilReport.formatFullNumber(summary.lengthOfStayTotal));
            this.summary.lengthOfStayAvg(BaseCostUtilReport.formatFullNumber(summary.lengthOfStayAvg));

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
