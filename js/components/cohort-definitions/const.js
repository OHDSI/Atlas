define(['knockout'], function(ko){

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

  return {
    importTabModes,
    conceptSetTabModes,
    cohortTabModes,
  };
});