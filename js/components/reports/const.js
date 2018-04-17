define(
  ['knockout'],
  function(ko) {

    const getPeriodTypeFilter = () => ({
      type: 'select',
      label: 'Period type',
      name: 'periodType',
      options: ko.observableArray([
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
      ]),
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
    };
  }
);