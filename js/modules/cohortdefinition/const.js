define(
  ['knockout'],
  function(ko) {

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
    
    const getPeriodTypeFilter = () => ({
      type: 'select',
      label: 'Period type',
      name: 'periodType',
      options: ko.observableArray(periods),
      selectedValue: ko.observable('mm'),
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

    return {
      windowType,
      visitStat,
      //
      getPeriodTypeFilter,
      periods,
    };
  }
);