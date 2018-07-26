define(
  (require, exports) => {
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
      sourcecodes: 'sourcecodes',
      export: 'export',
    };

    const paths = {
      details: id => `#/cohortdefinition/${id}`,
    };

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
      importTabModes,
      conceptSetTabModes,
      paths,
      windowType,
      visitStat,
      getPeriodTypeFilter,
    };
  }
);