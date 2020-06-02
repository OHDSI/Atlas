define(
  [
    'knockout',
    'text!./visit-util.html',
    'pages/cohort-definitions/components/reporting/cost-utilization/base-report',
    'pages/cohort-definitions/const',
    'services/CohortResults',
    'appConfig',
    'utils/CommonUtils',
    'components/visualizations/filter-panel/filter-panel',
    'pages/cohort-definitions/components/reporting/cost-utilization/table-baseline-exposure',
    'less!./visit-util.less',
    'components/visualizations/line-chart',
  ],
  function (
    ko,
    view,
    BaseCostUtilReport,
    costUtilConst,
    CohortResultsService,
    appConfig,
    commonUtils
  ) {

    const componentName = 'cost-utilization-visit-util';

    const VISIT_CONCEPT = 'visitConcept';
    const VISIT_TYPE_CONCEPT = 'visitTypeConcept';

    class VisitUtilReport extends BaseCostUtilReport {

      constructor(params) {
        super(params);

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
          allowed: ko.observable(),
          allowedPmPm: ko.observable(),
          charged: ko.observable(),
          chargedPmPm: ko.observable(),
          paid: ko.observable(),
          paidPmPm: ko.observable(),
          allowedChargedRatio: ko.observable(),
          paidAllowedRatio: ko.observable(),
        };

        this.tableColumns = [
          {
            title: ko.i18n('columns.periodStart', 'Period start'),
            data: 'periodStart',
            className: this.classes('tbl-col', 'period-start'),
          },
          {
            title: ko.i18n('columns.periodEnd', 'Period end'),
            data: 'periodEnd',
            className: this.classes('tbl-col', 'period-end'),
          },
          {
            title: ko.i18n('columns.personsCount', 'Persons'),
            data: 'personsCount',
            className: this.classes('tbl-col', 'persons-count'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.personsPct', 'Persons %'),
            data: 'personsPct',
            className: this.classes('tbl-col', 'persons-pct'),
            showInChart: true,
            render: BaseCostUtilReport.formatPercents,
            yFormat: BaseCostUtilReport.formatPercents,
          },
          {
            title: ko.i18n('columns.visitsCount', 'Records'),
            data: 'visitsCount',
            className: this.classes('tbl-col', 'records-total'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000', 'Records/1K'),
            data: 'visitsPer1000',
            className: this.classes('tbl-col', 'records-per-1000'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000WithVisits', 'Records/1K +record'),
            data: 'visitsPer1000WithVisits',
            className: this.classes('tbl-col', 'records-per-1000-with-records'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.visitsPer1000PerYear', 'Records/1K/Year'),
            data: 'visitsPer1000PerYear',
            className: this.classes('tbl-col', 'records-per-1000-per-year'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.lengthOfStayTotal', 'Days of Stay'),
            data: 'lengthOfStayTotal',
            className: this.classes('tbl-col', 'total-length-stay'),
            showInChart: true,
            render: BaseCostUtilReport.formatFullNumber,
          },
          {
            title: ko.i18n('columns.lengthOfStayAvg', 'Avg. Days of Stay'),
            data: 'lengthOfStayAvg',
            className: this.classes('tbl-col', 'total-length-avg'),
            showInChart: true,
            render: BaseCostUtilReport.formatPreciseNumber,
          },
          ...(appConfig.enableCosts ? this.getCostColumns() : [])
        ];

        const chartList = this.tableColumns.filter(item => item.showInChart);

        this.chartOptions = ko.observableArray(chartList.map(c => ({ label: c.title, value: c.title })));
        this.displayedCharts = ko.observableArray(this.chartOptions().map(o => o.value));

        this.currentTab(this.rawDataTab);

        this.setupChartsData(chartList);
        this.init();
      }

      getFilterList() {
        const filters = [
          costUtilConst.getPeriodTypeFilter(this.periods),
          {
            type: 'select',
            label: ko.i18n('cohortDefinitions.filters.visit', 'Visit'),
            name: VISIT_CONCEPT,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
          {
            type: 'select',
            label: ko.i18n('cohortDefinitions.filters.visitType', 'Visit type'),
            name: VISIT_TYPE_CONCEPT,
            options: ko.observableArray([]),
            selectedValue: ko.observable(null),
          },
        ];
        return filters;
      }

      setupVisitConceptOptions(conceptList) {
        const filter = this.filterList().find(filter => filter.name === VISIT_CONCEPT);
        filter.options([
          { label: ko.i18n('options.allVisits', 'All visits'), value: null },
          ...VisitUtilReport.conceptsToOptions(conceptList)
        ]);
      }

      setupVisitTypeConceptOptions(conceptList) {
        const filter = this.filterList().find(filter => filter.name === VISIT_TYPE_CONCEPT);
        filter.options([
          { label: ko.i18n('options.allVisitTypes', 'All visit types'), value: null },
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
            /* Costs */
            this.summary.allowed(BaseCostUtilReport.formatPreciseNumber(summary.allowed));
            this.summary.allowedPmPm(BaseCostUtilReport.formatPreciseNumber(summary.allowedPmPm));
            this.summary.charged(BaseCostUtilReport.formatPreciseNumber(summary.charged));
            this.summary.chargedPmPm(BaseCostUtilReport.formatPreciseNumber(summary.chargedPmPm));
            this.summary.paid(BaseCostUtilReport.formatPreciseNumber(summary.paid));
            this.summary.paidPmPm(BaseCostUtilReport.formatPreciseNumber(summary.paidPmPm));
            this.summary.allowedChargedRatio(BaseCostUtilReport.formatPreciseNumber(summary.allowedChargedRatio));
            this.summary.paidAllowedRatio(BaseCostUtilReport.formatPreciseNumber(summary.paidAllowedRatio));

            this.setupVisitConceptOptions(visitConcepts);
            this.setupVisitTypeConceptOptions(visitTypeConcepts);

            this.dataList(data);
          });
      }
    }

    return commonUtils.build(componentName, VisitUtilReport, view);
  }
);
