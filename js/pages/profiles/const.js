define(
  (require, exports) => {
    const pageTitle = 'Profiles';
    const paths = {
      source: sourceKey => `#/profiles/${sourceKey}`,
      person: (sourceKey, personId) => `#/profiles/${sourceKey}/${personId}`,
      sample: (sourceKey, personId, cohortDefinitionId, sampleId) => `#/profiles/${sourceKey}/${personId}/${cohortDefinitionId}/${sampleId}`,
    };

    return {
      pageTitle,
      paths,
    };
  }
);