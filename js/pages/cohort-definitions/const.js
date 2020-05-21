define(
  ['knockout', 'lodash', 'exports'],
  (ko, _, exports) => {
    const periods = [
      {
        label: ko.i18n('options.ww', 'Weekly'),
        value: 'ww',
      },
      {
        label: ko.i18n('options.mm', 'Monthly'),
        value: 'mm',
      },
      {
        label: ko.i18n('options.qq', 'Quarterly'),
        value: 'qq',
      },
      {
        label: ko.i18n('options.yy', 'Yearly'),
        value: 'yy',
      },
    ];
    
    const cohortTabModes = {
      definition: 'definition',
      conceptsets: 'conceptsets',
      generation: 'generation',
      reporting: 'reporting',
      explore: 'explore',
      export: 'export',
    };
  
    const importTabModes = {
      identifiers: 'identifiers',
      sourcecodes: 'sourcecodes',
      conceptset: 'conceptset',
    };
    const conceptSetTabModes = {
      details: 'details',
      included: 'included',
      import: 'import',
      included: 'included',
      sourcecodes: 'included-sourcecodes',
      export: 'export',
    };

    const paths = {
      details: id => `/cohortdefinition/${id}`,
    };

		const getPeriodTypeFilter = (chosenPeriods) => ({
			type: 'select',
			label: ko.i18n('options.periodType', 'Period type'),
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
        label: ko.i18n('options.rollupUtilizationVisit', 'Visits'),
        value: 'rollupUtilizationVisit',
      },
      {
        label: ko.i18n('options.rollupUtilizationDrug', 'Drugs'),
        value: 'rollupUtilizationDrug',
      },
    ];

    return {
      importTabModes,
      conceptSetTabModes,
      paths,
      windowType,
      visitStat,
      getPeriodTypeFilter,
      periods,
      rollups,
    };
  }
);