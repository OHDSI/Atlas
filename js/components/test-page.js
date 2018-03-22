define(['knockout', 'text!./test-page.html', 'appConfig', 'components/visualizations/filter-panel/filter-panel'], function (ko, view, appConfig) {
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

  var component = {
    viewModel: testPage,
    template: view
  };

  ko.components.register('test-page', component);
  return component;
});
