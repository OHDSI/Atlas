define(
  [],
  function() {

     const getSelectedFilterValues = (filterList) => filterList.reduce(
      (selectedAgg, filterEntry) => {

        if (filterEntry.type === 'select') {
          selectedAgg[filterEntry.name] = filterEntry.selectedValue();
        }
        else if (filterEntry.type === 'multiselect') {
          selectedAgg[filterEntry.name] = filterEntry.selectedValues()[0];
        }

        return selectedAgg;
      },
      {}
    );

    return {
      getSelectedFilterValues,
    };
  }
);