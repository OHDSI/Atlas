define(
  [
    'knockout',
    'text!./filter-panel.html',
    'utils/BemHelper',
    'less!./filter-panel.less',
    'components/multi-select'
  ],
  function (ko, view, BemHelper) {
    const componentName = 'visualizations-filter-panel';

    function filterPanel(params) {
      // Styling
      const bemHelper = new BemHelper(componentName);
      this.classes = bemHelper.run.bind(bemHelper);

      //

      this.filterList = params.filterList;
      this.live = params.live || false;
      this.apply = params.apply;
      this.clear = () => this.filterList().forEach(filter => filter.selectedValues([]));

      // Do not show "Apply" button in live mode and trigger filtering immediately
      if (this.live) {
        this.filterListSubscription = this.filterList.subscribe(newFilter => {
          Object.values(newFilter).map(filter => {
            let prevVal;
            if (filter.type === 'select') {
              prevVal = filter.selectedValue();
              filter.subscription = filter.selectedValue.subscribe(() => {
                if (prevVal != filter.selectedValue()) {
                  prevVal = filter.selectedValue();
                  this.apply()
                }
              });
            }
          })
        }
        );
      }

      this.dispose = () => {
        this.filterList().forEach(filter => {
          if (filter.subscription) {
            filter.subscription.dispose();
          }
        });
        this.filterListSubscription.dispose();
      };
      
    }
    const component = {
      viewModel: filterPanel,
      template: view
    };

    ko.components.register(componentName, component);
    return component;
});