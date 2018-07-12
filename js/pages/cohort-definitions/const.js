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
  
    return {
      importTabModes,
      conceptSetTabModes,
      paths,
    };
  }
);