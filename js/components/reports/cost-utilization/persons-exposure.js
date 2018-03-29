define(
  [
    'knockout',
    'text!./persons-exposure.html',
    'appConfig',
    'atlascharts',
    'd3',
    'd3-scale',
    'webapi/MomentAPI',
    'utils/BemHelper',
    'appConfig',
    'moment',
    'bindings/lineChart',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/table-baseline-exposure/table-baseline-exposure',
    'less!./persons-exposure.less',
  ],
  function (ko, view, appConfig, atlascharts, d3, d3scale, MomentAPI, BemHelper, config, moment) {

    const componentName = 'cost-utilization-persons-exposure';

    function costUtilPersonsAndExposure(params) {

      const self = this;

      // Input params

      this.mode = params.mode;
      this.source = params.source();
      this.cohortId = params.cohortId();

      // Styling

      const bemHelper = new BemHelper(componentName);
      this.classes = bemHelper.run.bind(bemHelper);

      this.loading = ko.observable(true);

      // Tabs

      this.visualizationTab = 0;
      this.rawDataTab = 1;
      this.tabLabels = {
        [this.visualizationTab]: 'Visualization',
        [this.rawDataTab]: 'Raw data',
      };
      this.currentTab = ko.observable(this.visualizationTab);

      // Data and filtering

      this.dataList = ko.observableArray();

      this.summary = {
        personsCount: ko.observable(0),
        exposureTotal: ko.observable(0),
        exposureAvg: ko.observable(0),
      };

      this.filterList = [
        {
          type: 'select',
          label: 'Period type',
          name: 'periodType',
          options: [
            {
              label: 'Weekly',
              value: 'ww',
            },
            {
              label: 'Montly',
              value: 'mm',
            },
            {
              label: 'Quarterly',
              value: 'qq',
            },
            {
              label: 'Yearly',
              value: 'yy',
            },
          ],
          selectedValues: ko.observableArray(['ww']),
        },
      ];

      this.loadData = (filters) => {
        this.loading(true);

        $.ajax({
          url: `${appConfig.api.url}cohortresults/${this.source}/${this.cohortId}/healthcareutilization/exposure/${this.mode}`,
          method: 'GET',
          data: filters,
          contentType: 'application/json',
          success: ({ summary, data }) => {
            self.summary.personsCount(summary.personsCount);
            self.summary.exposureTotal(summary.exposureTotal);
            self.summary.exposureAvg(summary.exposureAvg);

            self.dataList(data);

            self.loading(false);
          },
        });
      };

      this.getSelectedFilterValues = () => this.filterList.reduce(
        (selectedAgg, filterEntry) => {

          if (filterEntry.type === 'select') {
            selectedAgg[filterEntry.name] = filterEntry.selectedValues()[0];
          }
          else if (filterEntry.type === 'multiselect') {
            selectedAgg[filterEntry.name] = filterEntry.selectedValues()[0];
          }

          return selectedAgg;
        },
        {}
      );

      this.applyFilters = () => this.loadData(this.getSelectedFilterValues());

      // Charts data

      this.personsChartData = ko.computed(() => {
        return this.dataList().map((entry, idx) => ({
          id: idx,
          xValue: moment(entry.periodStart).toDate(),
          yValue: parseFloat(entry.personsCount),
        }));
      });

      this.totalExposureChartData = ko.computed(() => {
        return this.dataList().map((entry, idx) => ({
          id: idx,
          xValue: moment(entry.periodStart).toDate(),
          yValue: parseFloat(entry.exposureTotal),
        }));
      });

      this.avgExposurePerPersonChartData = ko.computed(() => {
        return this.dataList().map((entry, idx) => ({
          id: idx,
          xValue: moment(entry.periodStart).toDate(),
          yValue: parseFloat(entry.exposureAvg),
        }));
      });

      this.dateTickFormat = d3.timeFormat('%Y-%m-%d');
      this.emptyTickFormat = () => null;
      this.formatDate = val => MomentAPI.formatDate(val, 'D MMM Y');

      // On init

      this.loadData(this.getSelectedFilterValues());
    }

    const component = {
      viewModel: costUtilPersonsAndExposure,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
  }
);
