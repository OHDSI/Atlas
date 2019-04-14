define(
  ['knockout', 'lodash', 'exports'],
  (ko, _, exports) => {
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