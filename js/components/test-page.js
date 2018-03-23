define(
  [
    'knockout',
    'text!./test-page.html',
    'appConfig',
    'components/visualizations/filter-panel/filter-panel',
    'components/visualizations/table-baseline-exposure/table-baseline-exposure',
    'less!components/test-page.less',
  ],
  function (ko, view, appConfig) {

    function testPage(params) {

      this.apply = () => {
        const selectedValuesAgg = this.filterList.reduce(
          (selectedAgg, filterEntry) => {
            selectedAgg[filterEntry.name] = filterEntry.selectedValues();
            return selectedAgg;
          },
          {}
        );
        console.log(selectedValuesAgg);
      };

      this.filterList = [
        {
          type: 'multiselect',
          label: 'Visit Type ',
          name: 'visit_type',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        {
          type: 'multiselect',
          label: 'Visit Concept',
          name: 'visit_concept',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        {
          type: 'multiselect',
          label: 'Condition concept',
          name: 'condition_concept',
          options: [
            {
              label: 'Visit derived from encounter on medical claim',
              value: 1,
            },
            {
              label: 'Visit derived from encounter on pharmacy claim',
              value: 2,
            },
            {
              label: 'Visit derived from encounter on medical facility claim',
              value: 3,
            },
            {
              label: 'Visit derived from encounter on medical professional claim',
              value: 4,
            }
          ],
          selectedValues: ko.observableArray(),
        },
        {
          type: 'multiselect',
          label: 'Condition type',
          name: 'condition_type',
          options: [
            {
              label: 'Condition tested for by diagnostic procedure',
              value: 1,
            },
            {
              label: 'EHR billing diagnosis',
              value: 2,
            },
            {
              label: 'EHR encounter diagnosis',
              value: 3,
            }
          ],
          selectedValues: ko.observableArray(),
        },
      ];
    }

    this.dataList = [
      {
        period: 'Jan 1st 2017 to Jan 7th 2017',
        personsCount: 55,
        personsPct: '33.7%',
        exposureTotal: 1.0,
        exposurePct: '23.0%',
        exposureAvg: 0.02
      },

      {
        period: 'Jan 8st 2017 to Jan 14th 2017',
        personsCount: 98,
        personsPct: '60.1%',
        exposureTotal: 1.9,
        exposurePct: '44.1%',
        exposureAvg: 0.02
      },
      {
        period: 'Jan 15st 2017 to Jan 21th 2017',
        personsCount: 54,
        personsPct: '33.1%',
        exposureTotal: 1.0,
        exposurePct: '22.6%',
        exposureAvg: 0.02
      },
      {
        period: 'Jan 22nd 2017 to Jan 31st 2017',
        personsCount: 32,
        personsPct: '19.6%',
        exposureTotal: 0.4,
        exposurePct: '10.3%',
        exposureAvg: 0.01
      },
    ];

    var component = {
      viewModel: testPage,
      template: view
    };

    ko.components.register('test-page', component);
    return component;
  }
);
