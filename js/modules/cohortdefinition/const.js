define(
  ['knockout', 'lodash'],
  function(ko, _) {

    const periods = [
      {
        label: 'Weekly',
        value: 'ww',
      },
      {
        label: 'Monthly',
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
    ];
    
    const getPeriodTypeFilter = (chosenPeriods) => ({
      type: 'select',
      label: 'Period type',
      name: 'periodType',
      options: ko.observableArray(periods.filter(p => chosenPeriods.includes(p.value))),
      selectedValue: ko.observable(_.first(chosenPeriods)),
    });

    const windowType = {
      baseline: 'baseline',
      atrisk: 'atrisk',
    };

    const visitStat = {
      occurrence: 'occurrence',
      visitdate: 'visitdate',
      caresitedate: 'caresitedate',
    };

    const rollups = [
      {
        label: 'Visits',
        value: 'rollupUtilizationVisit',
      },
      {
        label: 'Drugs',
        value: 'rollupUtilizationDrug',
      },
    ];

    return {
      windowType,
      visitStat,
      //
      getPeriodTypeFilter,
      periods,
      rollups,
    };
  }
);